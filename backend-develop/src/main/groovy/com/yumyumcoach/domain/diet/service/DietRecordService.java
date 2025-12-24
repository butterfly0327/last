package com.yumyumcoach.domain.diet.service;

import com.yumyumcoach.domain.ai.event.NutritionReviewRequestedEvent;
import com.yumyumcoach.domain.challenge.service.ChallengeProgressTriggerService;
import com.yumyumcoach.domain.diet.dto.CreateDietRecordRequest;
import com.yumyumcoach.domain.diet.dto.DietRecordDto;
import com.yumyumcoach.domain.diet.mapper.DietFoodMapper;
import com.yumyumcoach.domain.diet.mapper.DietRecordMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.yumyumcoach.global.exception.BusinessException;
import com.yumyumcoach.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DietRecordService {

    private final DietRecordMapper dietRecordMapper;
    private final DietFoodMapper dietFoodMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final ChallengeProgressTriggerService challengeProgressTriggerService;

    @Transactional(readOnly = true)
    public List<DietRecordDto> getMyDiets(String email, LocalDate date, int page, int size) {
        int limit = Math.max(size, 1);
        int offset = Math.max(page, 0) * limit;
        return dietRecordMapper.selectDietRecordsByUserAndDate(email, date, offset, limit);
    }

    @Transactional(readOnly = true)
    public DietRecordDto getMyDietDetail(String email, Long dietId) {
        DietRecordDto dto = dietRecordMapper.selectDietRecordDetail(dietId, email);
        if (dto == null) {
            throw new BusinessException(ErrorCode.DIET_NOT_FOUND);
        }
        return dto;
    }

    @Transactional
    public Long createMyDiet(String email, CreateDietRecordRequest request) {
        dietRecordMapper.insertDietRecord(email, request);
        Long dietId = request.getId();
        if (dietId == null) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "식단 ID 생성에 실패했습니다.");
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            dietFoodMapper.insertDietFoods(dietId, request.getItems());
        }

        challengeProgressTriggerService.onDietChanged(email, request.getRecordedAt());

        LocalDate anchor = request.getRecordedAt().toLocalDate();
        eventPublisher.publishEvent(new NutritionReviewRequestedEvent(email, anchor));
        return dietId;
    }

    @Transactional
    public void deleteMyDiet(String email, Long dietId) {
        String owner = dietRecordMapper.selectOwnerEmail(dietId);
        if (owner == null) {
            throw new BusinessException(ErrorCode.DIET_NOT_FOUND);
        }
        if (!owner.equals(email)) {
            throw new BusinessException(ErrorCode.DIET_FORBIDDEN);
        }

        LocalDateTime recordedAt = dietRecordMapper.selectRecordedAtByIdAndEmail(dietId, email);
        if (recordedAt == null) throw new BusinessException(ErrorCode.DIET_FORBIDDEN);
        LocalDate anchor = recordedAt.toLocalDate();

        dietFoodMapper.deleteDietFoodsByDietId(dietId);
        int deleted = dietRecordMapper.deleteDietRecord(dietId, email);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.DIET_NOT_FOUND);
        }

        challengeProgressTriggerService.onDietChanged(email, recordedAt);

        eventPublisher.publishEvent(new NutritionReviewRequestedEvent(email, anchor));
    }

    @Transactional
    public void updateMyDiet(String email, Long dietId, CreateDietRecordRequest request) {
        String owner = dietRecordMapper.selectOwnerEmail(dietId);
        if (owner == null) {
            throw new BusinessException(ErrorCode.DIET_NOT_FOUND);
        }
        if (!owner.equals(email)) {
            throw new BusinessException(ErrorCode.DIET_FORBIDDEN);
        }
        LocalDateTime beforeRecordedAt = dietRecordMapper.selectRecordedAtByIdAndEmail(dietId, email);
        if (beforeRecordedAt == null) {
            throw new BusinessException(ErrorCode.DIET_FORBIDDEN);
        }

        int updated = dietRecordMapper.updateDietRecord(dietId, email, request);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.DIET_NOT_FOUND);
        }

        dietFoodMapper.deleteDietFoodsByDietId(dietId);
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            dietFoodMapper.insertDietFoods(dietId, request.getItems());
        }

        LocalDateTime afterRecordedAt = request.getRecordedAt();

        challengeProgressTriggerService.onDietChanged(email, beforeRecordedAt);
        if (!afterRecordedAt.toLocalDate().isEqual(beforeRecordedAt.toLocalDate())) {
            challengeProgressTriggerService.onDietChanged(email, afterRecordedAt);
        }

        LocalDate anchor = afterRecordedAt.toLocalDate();
        eventPublisher.publishEvent(new NutritionReviewRequestedEvent(email, anchor));
    }
}


package com.yumyumcoach.domain.challenge.service;

import com.yumyumcoach.domain.challenge.entity.Challenge;
import com.yumyumcoach.domain.challenge.entity.ChallengeParticipant;
import com.yumyumcoach.domain.challenge.entity.ChallengeRule;
import com.yumyumcoach.domain.challenge.mapper.ChallengeMapper;
import com.yumyumcoach.domain.challenge.mapper.ChallengeParticipantMapper;
import com.yumyumcoach.domain.challenge.mapper.ChallengeRuleMapper;
import com.yumyumcoach.domain.challenge.model.GoalType;
import com.yumyumcoach.domain.title.mapper.AccountTitleMapper;
import com.yumyumcoach.global.exception.BusinessException;
import com.yumyumcoach.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 챌린지 참여자 관련 비즈니스 로직을 담당하는 서비스.
 * 진행률 / 성공 일수 평가 (successDays, progressPercentage 갱신)
 *
 * 반영 사항
 * - goalType별 successDays를 기록 테이블에서 계산
 *   1) DIET_DAY_COUNT        : diet_records 날짜 distinct count
 *   2) EXERCISE_DAY_COUNT     : exercise_records 날짜 distinct count
 *   3) PROTEIN_PER_DAY        : 날짜별 단백질 합 >= participant.dailyTargetValue 인 날짜 count
 * - 완료 처리:
 *   successDays >= requiredSuccessDays 이면 status=completed, completed_at 세팅
 * - 보상(타이틀) 지급:
 *   challenge_rules.reward_title_id 조회 후 account_titles에 INSERT IGNORE
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChallengeParticipantService {
    private final ChallengeMapper challengeMapper;
    private final ChallengeParticipantMapper challengeParticipantMapper;
    private final ChallengeRuleMapper challengeRuleMapper;
    private final AccountTitleMapper accountTitleMapper;

    /**
     * 특정 챌린지에 참여 중인 한 명의 사용자의 진행률을 재평가한다.
     * @param challengeId 챌린지 ID
     * @param email       사용자 이메일
     */
    @Transactional
    public void evaluateProgress(Long challengeId, String email) {
        // 1) 챌린지 / 참여 정보 조회
        Challenge challenge = challengeMapper.findById(challengeId);
        if (challenge == null) {
            throw new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND);
        }

        ChallengeParticipant participant = challengeParticipantMapper.findByChallengeIdAndEmail(challengeId, email);
        if (participant == null) {
            throw new BusinessException(ErrorCode.CHALLENGE_JOIN_NOT_FOUND);
        }

        if ("left".equalsIgnoreCase(participant.getStatus()) || "completed".equalsIgnoreCase(participant.getStatus())) {
            return;
        }

        // 2) goalType별 성공 일수 계산
        GoalType goalType;
        try {
            goalType = GoalType.from(challenge.getGoalType());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "goalType이 올바르지 않습니다.");
        }

        // 기간: start_date 00:00:00 ~ (end_date + 1일) 00:00:00
        LocalDateTime startAt = challenge.getStartDate().atStartOfDay();
        LocalDateTime endAt = challenge.getEndDate().plusDays(1).atStartOfDay();

        int successDays = switch (goalType) {
            case DIET_DAY_COUNT -> challengeParticipantMapper.countDietSuccessDays(email, startAt, endAt);
            case EXERCISE_DAY_COUNT -> challengeParticipantMapper.countExerciseSuccessDays(email, startAt, endAt);
            case PROTEIN_PER_DAY -> {
                Double dailyTarget = participant.getDailyTargetValue();
                if (dailyTarget == null || dailyTarget <= 0) {
                    throw new BusinessException(ErrorCode.CHALLENGE_RULE_INVALID);
                }
                yield challengeParticipantMapper.countProteinSuccessDays(email, startAt, endAt, dailyTarget);
            }

            // 추후 확장 예정...
            case EXERCISE_MINUTES_PER_DAY -> throw new BusinessException(ErrorCode.CHALLENGE_RULE_INVALID);
        };

        int required = participant.getRequiredSuccessDays() != null ? participant.getRequiredSuccessDays() : 0;

        double progress = 0.0;
        if (required > 0) {
            progress = (successDays * 100.0) / required;
            if (progress > 100.0) progress = 100.0;
        }

        LocalDateTime now = LocalDateTime.now();

        // 3) progress 업데이트
        participant.updateProgress(successDays, progress, now);
        challengeParticipantMapper.updateProgress(challengeId, email, successDays, progress, now);

        // 4) 완료 처리 + 보상 지급
        boolean alreadyCompleted = "completed".equalsIgnoreCase(participant.getStatus());
        if (required > 0 && successDays >= required && !alreadyCompleted) {

            ChallengeRule rule = challengeRuleMapper.findByChallengeIdAndDifficulty(
                    challengeId,
                    participant.getDifficultyCode()
            );
            if (rule == null || rule.getRewardTitleId() == null) {
                throw new BusinessException(ErrorCode.CHALLENGE_RULE_NOT_FOUND);
            }

            // 상태 업데이트
            participant.complete(now);
            challengeParticipantMapper.updateStatus(challengeId, email, "completed", now);

            // 타이틀 지급 (중복은 UNIQUE + INSERT IGNORE로 방지)
            accountTitleMapper.insertIgnore(email, rule.getRewardTitleId(), now, challengeId);
        }
    }
}


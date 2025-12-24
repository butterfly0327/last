package com.yumyumcoach.domain.challenge.service;

import com.yumyumcoach.domain.challenge.mapper.ChallengeParticipantMapper;
import com.yumyumcoach.domain.challenge.model.GoalType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChallengeProgressTriggerService {

    private final ChallengeParticipantMapper challengeParticipantMapper;
    private final ChallengeParticipantService challengeParticipantService;

    /**
     * 식단 기록/식단 구성(foods) 변경 시 호출
     * - 식단 일수 챌린지 + 단백질 챌린지에 영향을 줌
     */
    @Transactional
    public void onDietChanged(String email, LocalDateTime recordedAt) {
        LocalDate date = (recordedAt == null) ? LocalDate.now() : recordedAt.toLocalDate();

        List<String> goalTypes = List.of(
                GoalType.DIET_DAY_COUNT.getCode(),
                GoalType.PROTEIN_PER_DAY.getCode()
        );

        List<Long> challengeIds =
                challengeParticipantMapper.findRunningJoinedChallengeIdsByGoalTypes(email, date, goalTypes);

        for (Long challengeId : challengeIds) {
            challengeParticipantService.evaluateProgress(challengeId, email);
        }
    }

    /**
     * 운동 기록 변경 시 호출
     * - 운동 일수 챌린지에 영향을 줌
     */
    @Transactional
    public void onExerciseChanged(String email, LocalDateTime recordedAt) {
        LocalDate date = (recordedAt == null) ? LocalDate.now() : recordedAt.toLocalDate();

        List<String> goalTypes = List.of(
                GoalType.EXERCISE_DAY_COUNT.getCode()
        );

        List<Long> challengeIds =
                challengeParticipantMapper.findRunningJoinedChallengeIdsByGoalTypes(email, date, goalTypes);

        for (Long challengeId : challengeIds) {
            challengeParticipantService.evaluateProgress(challengeId, email);
        }
    }
}

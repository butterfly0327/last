package com.yumyumcoach.domain.challenge.model;

public enum GoalType {
    DIET_DAY_COUNT,          // 식단: 하루 1건 이상 기록한 날 카운트
    EXERCISE_DAY_COUNT,      // 운동: 하루 1건 이상 기록한 날 카운트
    PROTEIN_PER_DAY,         // 하루 단백질 Xg 이상인 날 N일 이상
    EXERCISE_MINUTES_PER_DAY; // 하루 운동 Y분 이상인 날 N일 이상 (향후 확장용)

    public static GoalType from(String value) {
        return GoalType.valueOf(value);
    }

    public String getCode() {
        return this.name();
    }
}

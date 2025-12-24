package com.yumyumcoach.domain.title.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface AccountTitleMapper {
    int insertIgnore(
            @Param("email") String email,
            @Param("titleId") Long titleId,
            @Param("obtainedAt") LocalDateTime obtainedAt,
            @Param("sourceChallengeId") Long sourceChallengeId
    );
}

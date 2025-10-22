package com.tortilleria.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tortilleria.core.domain.entities.UserRole

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val username: String,
    val passwordHash: String,
    val role: String,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

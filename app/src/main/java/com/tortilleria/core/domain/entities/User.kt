package com.tortilleria.core.domain.entities

data class User(
    val id: String,
    val username: String,
    val passwordHash: String,
    val role: UserRole,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

enum class UserRole {
    OWNER, SUPERVISOR, ADMIN, CASHIER, DELIVERY, AUDITOR
}

package com.tortilleria.core.domain.repositories

import com.tortilleria.core.domain.entities.User

interface UserRepository {
    suspend fun login(username: String, password: String): Result<User>
    suspend fun getUsers(): List<User>
    suspend fun createUser(user: User): Result<Unit>
    suspend fun updateUser(user: User): Result<Unit>
    suspend fun deleteUser(userId: String): Result<Unit>
}

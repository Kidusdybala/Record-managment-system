<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\LetterController;
use App\Http\Controllers\UserController;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('jwt');
    Route::get('me', [AuthController::class, 'me'])->middleware('jwt');
});

Route::middleware('jwt')->group(function () {
    Route::get('departments', [DepartmentController::class, 'index']);

    // User management (Record office only)
    Route::apiResource('users', UserController::class)->middleware('role:record_office');
    Route::patch('users/{id}/suspend', [UserController::class, 'suspend'])->middleware('role:record_office');
    Route::patch('users/{id}/activate', [UserController::class, 'activate'])->middleware('role:record_office');

    Route::get('letters/inbox', [LetterController::class, 'inbox']);
    Route::get('letters/sent', [LetterController::class, 'sent']);

    // Department users and ministers can create letters (to be reviewed by record office first)
    Route::post('letters', [LetterController::class, 'store'])->middleware('role:department,minister');

    // Download document
    Route::get('letters/{id}/document', [LetterController::class, 'downloadDocument'])->middleware('jwt');

    // Record office reviews and decides next step
    Route::patch('letters/{id}/admin-review', [LetterController::class, 'adminReview'])->middleware('role:record_office');

    // Minister approves or rejects
    Route::patch('letters/{id}/minister-decision', [LetterController::class, 'ministerDecision'])->middleware('role:minister');

    // Record office forwards to target department
    Route::patch('letters/{id}/forward', [LetterController::class, 'forward'])->middleware('role:record_office');
});
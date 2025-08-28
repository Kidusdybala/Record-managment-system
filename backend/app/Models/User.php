<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'department_id',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the department that the user belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the letters created by this user.
     */
    public function createdLetters(): HasMany
    {
        return $this->hasMany(Letter::class, 'created_by_user_id');
    }

    /**
     * Get the letters reviewed by this user (admin only).
     */
    public function reviewedLetters(): HasMany
    {
        return $this->hasMany(Letter::class, 'reviewed_by_admin_id');
    }

    /**
     * Check if user is a minister.
     */
    public function isMinister(): bool
    {
        return $this->role === 'minister';
    }

    /**
     * Check if user is record office (admin).
     */
    public function isRecordOffice(): bool
    {
        return $this->role === 'record_office';
    }

    /**
     * Check if user is a department user.
     */
    public function isDepartment(): bool
    {
        return $this->role === 'department';
    }

    /**
     * Check if user is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if user is suspended.
     */
    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    /**
     * Suspend the user.
     */
    public function suspend(): void
    {
        $this->update(['status' => 'suspended']);
    }

    /**
     * Activate the user.
     */
    public function activate(): void
    {
        $this->update(['status' => 'active']);
    }
}

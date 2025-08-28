<?php

namespace App\Http\Controllers;

use App\Models\Letter;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;

class LetterController extends Controller
{
    public function inbox(Request $request)
    {
        $role = $request->attributes->get('auth_role');
        $departmentId = $request->attributes->get('auth_department_id');

        if ($role === 'record_office') {
            // All pending_review or needs_minister_approval (for tracking) and items to forward
            $letters = Letter::with(['fromDepartment', 'toDepartment', 'creator'])
                ->whereIn('status', ['pending_review','minister_approved','minister_rejected'])
                ->latest()->get();
        } elseif ($role === 'minister') {
            $letters = Letter::with(['fromDepartment', 'toDepartment', 'creator'])
                ->where('status', 'needs_minister_approval')->latest()->get();
        } else { // department
            $letters = Letter::with(['fromDepartment', 'toDepartment', 'creator'])
                ->where('to_department_id', $departmentId)->latest()->get();
        }

        return response()->json(['data' => $letters]);
    }

    public function sent(Request $request)
    {
        $role = $request->attributes->get('auth_role');
        $departmentId = $request->attributes->get('auth_department_id');

        if ($role === 'department') {
            $letters = Letter::with(['fromDepartment', 'toDepartment', 'creator'])
                ->where('from_department_id', $departmentId)->latest()->get();
        } elseif ($role === 'minister') {
            // Ministers can see letters they created (where from_department_id is null and created_by_user_id matches)
            $letters = Letter::with(['fromDepartment', 'toDepartment', 'creator'])
                ->whereNull('from_department_id')
                ->where('created_by_user_id', $request->attributes->get('auth_user_id'))
                ->latest()->get();
        } else {
            $letters = Letter::with(['fromDepartment', 'toDepartment', 'creator'])
                ->latest()->limit(50)->get();
        }
        return response()->json(['data' => $letters]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document' => 'required|file|mimes:pdf,doc,docx|max:10240', // 10MB max
            'requires_minister' => 'nullable|string|in:true,false,1,0',
        ]);

        $role = $request->attributes->get('auth_role');
        $departmentId = $request->attributes->get('auth_department_id');
        $userId = $request->attributes->get('auth_user_id');

        // For ministers, we'll set from_department_id to null since they don't belong to a specific department
        // For department users, use their department_id
        $fromDepartmentId = $role === 'minister' ? null : $departmentId;

        // Handle file upload
        $document = $request->file('document');
        $documentName = $document->getClientOriginalName();
        $documentType = $document->getClientMimeType();
        $documentSize = $document->getSize();

        // Store the file in storage/app/documents
        $documentPath = $document->store('documents', 'public');

        // Convert requires_minister string to boolean
        $requiresMinister = $request->input('requires_minister');
        $requiresMinisterBool = $requiresMinister === 'true' || $requiresMinister === '1';

        $letter = Letter::create([
            'subject' => $request->string('subject'),
            'body' => '', // Empty body for document uploads
            'document_path' => $documentPath,
            'document_name' => $documentName,
            'document_type' => $documentType,
            'document_size' => $documentSize,
            'description' => $request->string('description', ''),
            'from_department_id' => $fromDepartmentId,
            'to_department_id' => null, // assigned after admin review/forward
            'requires_minister' => $requiresMinisterBool,
            'status' => 'pending_review',
            'created_by_user_id' => (int) $userId,
        ]);

        return response()->json(['data' => $letter], 201);
    }

    public function downloadDocument(string $id)
    {
        $letter = Letter::findOrFail($id);
        
        if (!$letter->document_path) {
            return response()->json(['message' => 'No document found'], 404);
        }

        $path = storage_path('app/public/' . $letter->document_path);
        
        if (!file_exists($path)) {
            return response()->json(['message' => 'Document file not found'], 404);
        }

        return response()->download($path, $letter->document_name);
    }

    public function adminReview(string $id, Request $request)
    {
        $request->validate([
            'action' => ['required', Rule::in(['forward','needs_minister'])],
            'to_department_id' => 'required_if:action,forward|nullable|integer|exists:departments,id',
        ]);

        $letter = Letter::findOrFail($id);

        if ($request->action === 'needs_minister') {
            $letter->update([
                'status' => 'needs_minister_approval',
                'reviewed_by_admin_id' => $request->attributes->get('auth_user_id'),
                'reviewed_at' => Carbon::now(),
                'requires_minister' => true,
            ]);
        } else { // forward directly
            $letter->update([
                'to_department_id' => (int) $request->input('to_department_id'),
                'status' => 'forwarded',
                'reviewed_by_admin_id' => $request->attributes->get('auth_user_id'),
                'reviewed_at' => Carbon::now(),
            ]);
        }

        return response()->json(['data' => $letter->fresh()]);
    }

    public function ministerDecision(string $id, Request $request)
    {
        $request->validate([
            'decision' => ['required', Rule::in(['approved','rejected'])],
        ]);

        $letter = Letter::findOrFail($id);
        if ($letter->status !== 'needs_minister_approval') {
            return response()->json(['message' => 'Invalid state'], 422);
        }

        $letter->update([
            'status' => $request->decision === 'approved' ? 'minister_approved' : 'minister_rejected',
            'minister_decision' => $request->decision,
            'minister_decided_at' => Carbon::now(),
        ]);

        return response()->json(['data' => $letter->fresh()]);
    }

    public function forward(string $id, Request $request)
    {
        $request->validate([
            'to_department_id' => 'required|integer|exists:departments,id',
        ]);

        $letter = Letter::findOrFail($id);
        if (!in_array($letter->status, ['minister_approved','forwarded'], true)) {
            return response()->json(['message' => 'Invalid state'], 422);
        }

        $letter->update([
            'to_department_id' => (int) $request->input('to_department_id'),
            'status' => 'delivered',
        ]);

        return response()->json(['data' => $letter->fresh()]);
    }
}
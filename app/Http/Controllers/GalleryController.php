<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        $status = $request->query('status', '');

        $query = Gallery::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%$search%")
                    ->orWhere('description', 'like', "%$search%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        $galleries = $query->orderBy('id', 'asc')->get();

        return view('gallery.index', [
            'galleries' => $galleries
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048'
        ]);

        $paths = [];

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $paths[] = $img->store('gallery', 'public');
            }
        }

        $gallery = Gallery::create([
            'title' => $request->title,
            'description' => $request->description,
            'images' => $paths,
            'status' => $request->status,
            'created_by' => 1, 
        ]);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Gallery created!', 'data' => $gallery]);
        }

        return redirect()->back()->with('success', 'Gallery created successfully');
    }

    public function edit($id)
    {
        $gallery = Gallery::findOrFail($id);

        return view('gallery.index', [
            'galleries' => Gallery::orderBy('id', 'desc')->get(),
            'gallery' => $gallery
        ]);
    }

    public function update(Request $request, $id)
    {
        $gallery = Gallery::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048'
        ]);

        $paths = $request->input('existing_images', []);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $paths[] = $img->store('gallery', 'public');
            }
        }

        $gallery->update([
            'title' => $request->title,
            'description' => $request->description,
            'images' => $paths,
            'status' => $request->status,
            'updated_by' => 1, 
        ]);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Gallery updated!']);
        }

        return redirect()->back()->with('success', 'Gallery updated successfully');
    }

    public function destroy($id)
    {
        $gallery = Gallery::findOrFail($id);

        if ($gallery->images) {
            foreach ($gallery->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }

        $gallery->delete();

        return response()->json(['success' => true]);
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        $galleries = Gallery::whereIn('id', $ids)->get();

        foreach ($galleries as $gallery) {
            if ($gallery->images) {
                foreach ($gallery->images as $img) {
                    Storage::disk('public')->delete($img);
                }
            }
            $gallery->delete();
        }

        return response()->json(['success' => true, 'message' => 'Selected galleries deleted']);
    }
}
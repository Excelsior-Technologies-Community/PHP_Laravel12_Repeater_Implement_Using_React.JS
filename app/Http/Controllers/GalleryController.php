<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Illuminate\Http\Request;

class GalleryController extends Controller
{
    /**
     * Display all gallery records.
     * Pass galleries to Blade for React.
     */
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

        // Get all galleries
        $galleries = $query->orderBy('id', 'asc')->get();

        return view('gallery.index', [
            'galleries' => $galleries
        ]);
    }

    /**
     * Store a new gallery record with multiple images.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'images.*' => 'image|mimes:jpg,jpeg,png'
        ]);

        $paths = [];

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $img) {
                $paths[] = $img->store('gallery', 'public');
            }
        }

        Gallery::create([
            'title' => $request->title,
            'description' => $request->description,
            'images' => $paths,
            'status' => $request->status,
            'created_by' => 1, // replace with auth()->id() if needed
        ]);

        return redirect()->back()->with('success', 'Gallery created successfully');
    }

    /**
     * Fetch a single gallery for editing.
     */
    public function edit($id)
    {
        $gallery = Gallery::findOrFail($id);

        return view('gallery.index', [
            'galleries' => Gallery::orderBy('id', 'desc')->get(),
            'gallery' => $gallery
        ]);
    }

    /**
     * Update gallery, keeping existing images and adding new.
     */
    public function update(Request $request, $id)
    {
        $gallery = Gallery::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'images.*' => 'image|mimes:jpg,jpeg,png'
        ]);

        // Keep existing images from hidden input
        $paths = $request->input('existing_images', []);

        // Add new uploaded images
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
            'updated_by' => 1, // replace with auth()->id() if needed
        ]);

        return redirect()->back()->with('success', 'Gallery updated successfully');
    }

    /**
     * Delete a gallery record.
     */
    public function destroy($id)
    {
        $gallery = Gallery::findOrFail($id);
        $gallery->delete();

        return response()->json(['success' => true]);
    }
}
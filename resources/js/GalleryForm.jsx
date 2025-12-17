import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * GalleryForm Component
 * Used for both CREATE and EDIT gallery
 */
function GalleryForm({ gallery, onBack }) {

    // Form state management
    const [title, setTitle] = useState(gallery?.title ?? '');
    const [description, setDescription] = useState(gallery?.description ?? '');
    const [status, setStatus] = useState(gallery?.status ?? 1);

    /**
     * Images state
     * - existing images come from database
     * - new images are selected via file input
     */
    const [images, setImages] = useState(
        gallery?.images?.map(img => ({ type: 'existing', value: img })) 
        || [{ type: 'new', value: null }]
    );

    // Add a new empty image input field
    const addImage = () => setImages([...images, { type: 'new', value: null }]);

    // Remove image field by index
    const removeImage = (i) => setImages(images.filter((_, index) => index !== i));

    // Handle file selection for new image
    const handleNewFileChange = (e, index) => {
        const file = e.target.files[0];
        const updated = [...images];
        updated[index] = { type: 'new', value: file };
        setImages(updated);
    };

    return (
        <div>

            {/* Back button to return to gallery list */}
            <button className="btn btn-secondary mb-3" onClick={onBack}>
                ← Back to List
            </button>

            {/* Gallery Create / Update Form */}
            <form
                method="POST"
                action={gallery ? `/gallery/${gallery.id}/update` : '/gallery/store'}
                encType="multipart/form-data"
            >
                {/* CSRF Token for Laravel security */}
                <input
                    type="hidden"
                    name="_token"
                    value={document.querySelector('meta[name="csrf-token"]').content}
                />

                {/* Form Title */}
                <h3>{gallery ? 'Edit Gallery' : 'Create Gallery'}</h3>

                {/* Title Field */}
                <label className="form-label" htmlFor="title">Title</label>
                <input
                    id="title"
                    type="text"
                    name="title"
                    value={title}
                    placeholder="Enter title"
                    onChange={e => setTitle(e.target.value)}
                    className="form-control mb-3"
                />

                {/* Description Field */}
                <label className="form-label" htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={description}
                    placeholder="Enter description"
                    onChange={e => setDescription(e.target.value)}
                    className="form-control mb-3"
                ></textarea>

                {/* Images Repeater Section */}
                <label className="form-label">Images</label>
                {images.map((imgObj, index) => (
                    <div key={index} className="d-flex mb-2 align-items-center">

                        {/* File input for image upload */}
                        <input
                            type="file"
                            name="images[]"
                            className="form-control"
                            onChange={(e) => handleNewFileChange(e, index)}
                        />

                        {/* Preview existing image */}
                        {imgObj.type === 'existing' && (
                            <img
                                src={`/storage/${imgObj.value}`}
                                width="50"
                                className="ms-2"
                            />
                        )}

                        {/* Remove image button */}
                        <button
                            type="button"
                            className="btn btn-danger ms-2"
                            onClick={() => removeImage(index)}
                        >
                            Remove
                        </button>

                        {/* Hidden input to keep existing images on update */}
                        {imgObj.type === 'existing' && (
                            <input
                                type="hidden"
                                name="existing_images[]"
                                value={imgObj.value}
                            />
                        )}
                    </div>
                ))}

                {/* Add new image input */}
                <button
                    type="button"
                    className="btn btn-secondary mb-3"
                    onClick={addImage}
                >
                    + Add Image
                </button>

                <br />

                {/* Status Field */}
                <label className="form-label" htmlFor="status">Status</label>
                <select
                    id="status"
                    name="status"
                    value={status}
                    className="form-control mb-3"
                    onChange={e => setStatus(e.target.value)}
                >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                </select>

                {/* Submit Button */}
                <button className="btn btn-primary">
                    {gallery ? 'Update' : 'Save'}
                </button>
            </form>
        </div>
    );
}

/**
 * GalleryIndex Component
 * Displays gallery list and handles add/edit/delete
 */
function GalleryIndex({ galleries }) {

    // Gallery list state
    const [list, setList] = useState(galleries);

    // Edit and Add mode state
    const [editingGallery, setEditingGallery] = useState(null);
    const [addingGallery, setAddingGallery] = useState(false);

    /**
     * Delete gallery using fetch API
     * Uses optimistic UI update
     */
    const handleDelete = (id) => {
        if (!confirm('Are you sure to delete?')) return;

        // Remove from UI immediately
        setList(list.filter(g => g.id !== id));

        // Send delete request to Laravel
        fetch(`/gallery/${id}/delete`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        }).then(() => console.log('Deleted'));
    };

    // Show create form
    if (addingGallery) {
        return <GalleryForm gallery={null} onBack={() => setAddingGallery(false)} />;
    }

    // Show edit form
    if (editingGallery) {
        return <GalleryForm gallery={editingGallery} onBack={() => setEditingGallery(null)} />;
    }

    // Show gallery list table
    return (
        <div>
            <h2>Gallery List</h2>

            {/* Add gallery button */}
            <button
                className="btn btn-primary mb-3"
                onClick={() => setAddingGallery(true)}
            >
                + Add Gallery
            </button>

            {/* Gallery Table */}
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Images</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map(gallery => (
                        <tr key={gallery.id}>
                            <td>{gallery.id}</td>
                            <td>{gallery.title}</td>
                            <td>{gallery.description}</td>
                            <td>
                                {gallery.images?.map((img, i) => (
                                    <img
                                        key={i}
                                        src={`/storage/${img}`}
                                        width="50"
                                        className="me-1"
                                    />
                                ))}
                            </td>
                            <td>{gallery.status ? 'Active' : 'Inactive'}</td>
                            <td>
                                <button
                                    className="btn btn-sm btn-warning me-2"
                                    onClick={() => setEditingGallery(gallery)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(gallery.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/**
 * Render React App
 */
createRoot(document.getElementById('app')).render(
    <GalleryIndex galleries={window.galleriesData} />
);

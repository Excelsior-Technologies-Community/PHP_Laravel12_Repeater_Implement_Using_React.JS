import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import toast, { Toaster } from 'react-hot-toast';
import { Reorder, AnimatePresence } from "framer-motion";

function GalleryForm({ gallery, onBack }) {
    const [title, setTitle] = useState(gallery?.title ?? '');
    const [description, setDescription] = useState(gallery?.description ?? '');
    const [status, setStatus] = useState(gallery?.status ?? 1);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [images, setImages] = useState(
        gallery?.images?.map((img, index) => ({ 
            id: `existing-${index}`, 
            type: 'existing', 
            value: img 
        })) || [{ id: Date.now().toString(), type: 'new', value: null, preview: null }]
    );

    const addImage = () => setImages([...images, { id: Date.now().toString(), type: 'new', value: null, preview: null }]);
    
    const removeImage = (id) => {
        if (images.length > 1) {
            setImages(images.filter((img) => img.id !== id));
        } else {
            toast.error("At least one image is required");
        }
    };

    const handleNewFileChange = (e, id) => {
        const file = e.target.files[0];
        if (file) {
            const updated = images.map(img => 
                img.id === id ? { ...img, value: file, preview: URL.createObjectURL(file) } : img
            );
            setImages(updated);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('status', status);

        images.forEach((img) => {
            if (img.type === 'new' && img.value) {
                formData.append('images[]', img.value);
            } else if (img.type === 'existing') {
                formData.append('existing_images[]', img.value);
            }
        });

        try {
            const response = await fetch(gallery ? `/gallery/${gallery.id}/update` : '/gallery/store', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                },
                body: formData
            });

            const data = await response.json();

            if (response.status === 422) {
                setErrors(data.errors);
                toast.error("Validation failed!");
            } else if (response.ok) {
                toast.success(gallery ? "Updated Successfully!" : "Saved Successfully!");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error("Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow border-0 p-4 mb-4">
            <Toaster position="top-right" />
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="m-0 text-primary fw-bold">{gallery ? 'Edit Gallery' : 'Create Gallery'}</h3>
                <button className="btn btn-light border" onClick={onBack}>← Back to List</button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-8">
                        <div className="mb-3">
                            <label className="form-label fw-bold">Title</label>
                            <input type="text" className={`form-control ${errors.title ? 'is-invalid' : ''}`} value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title" />
                            {errors.title && <div className="invalid-feedback">{errors.title[0]}</div>}
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold">Description</label>
                            <textarea className={`form-control ${errors.description ? 'is-invalid' : ''}`} value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter details..." rows="3"></textarea>
                            {errors.description && <div className="invalid-feedback">{errors.description[0]}</div>}
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="mb-3">
                            <label className="form-label fw-bold">Status</label>
                            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label fw-bold d-block">Gallery Repeater (Drag to Reorder)</label>
                    <Reorder.Group axis="y" values={images} onReorder={setImages} className="ps-0">
                        <AnimatePresence>
                            {images.map((imgObj, index) => (
                                <Reorder.Item 
                                    key={imgObj.id} 
                                    value={imgObj} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, y: -10 }}
                                    className="d-flex align-items-center mb-3 p-3 bg-light border rounded shadow-sm"
                                    style={{ cursor: 'grab' }}
                                >
                                    <div className="me-3 text-muted">☰</div>
                                    <div className="flex-grow-1">
                                        <input type="file" className={`form-control ${errors[`images.${index}`] ? 'is-invalid' : ''}`} onChange={e => handleNewFileChange(e, imgObj.id)} />
                                        {errors[`images.${index}`] && <div className="text-danger small">{errors[`images.${index}`][0]}</div>}
                                    </div>
                                    <div className="ms-3 text-center" style={{ width: '80px' }}>
                                        {imgObj.type === 'existing' && <img src={`/storage/${imgObj.value}`} width="60" height="60" className="rounded border shadow-sm object-fit-cover" />}
                                        {imgObj.type === 'new' && imgObj.preview && <img src={imgObj.preview} width="60" height="60" className="rounded border shadow-sm object-fit-cover" />}
                                    </div>
                                    <button type="button" className="btn btn-outline-danger btn-sm ms-3" onClick={() => removeImage(imgObj.id)}>Remove</button>
                                </Reorder.Item>
                            ))}
                        </AnimatePresence>
                    </Reorder.Group>
                    <button type="button" className="btn btn-outline-primary btn-sm px-4" onClick={addImage}>+ Add More Row</button>
                </div>

                <hr />
                <button type="submit" className="btn btn-primary px-5 shadow" disabled={loading}>
                    {loading ? 'Saving...' : (gallery ? 'Update Gallery' : 'Save Gallery')}
                </button>
            </form>
        </div>
    );
}

function GalleryIndex({ galleries }) {
    const [list, setList] = useState(galleries);
    const [editingGallery, setEditingGallery] = useState(null);
    const [addingGallery, setAddingGallery] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selected, setSelected] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 5;

    const toggleSelect = (id) => selected.includes(id) ? setSelected(selected.filter(s => s !== id)) : setSelected([...selected, id]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this gallery?')) return;
        try {
            const response = await fetch(`/gallery/${id}/delete`, { 
                method: 'POST', 
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content } 
            });
            if (response.ok) {
                setList(list.filter(g => g.id !== id));
                toast.success("Deleted!");
            }
        } catch (e) {
            toast.error("Delete failed");
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selected.length} items?`)) return;
        const toastId = toast.loading("Processing...");
        try {
            const response = await fetch('/gallery/bulk-delete', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content 
                },
                body: JSON.stringify({ ids: selected })
            });
            if (response.ok) {
                setList(list.filter(g => !selected.includes(g.id)));
                setSelected([]);
                toast.success("Bulk delete done!", { id: toastId });
            }
        } catch (e) {
            toast.error("Error", { id: toastId });
        }
    };

    const filtered = list
        .filter(g => g.title.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase()))
        .filter(g => statusFilter === '' || g.status.toString() === statusFilter);

    const totalPages = Math.ceil(filtered.length / perPage);
    const displayed = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    if (addingGallery) return <GalleryForm gallery={null} onBack={() => setAddingGallery(false)} />;
    if (editingGallery) return <GalleryForm gallery={editingGallery} onBack={() => setEditingGallery(null)} />;

    return (
        <div className="card shadow border-0 p-4">
            <Toaster position="top-right" />
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="m-0 text-dark fw-bold">Gallery Management</h2>
                <button className="btn btn-primary shadow-sm" onClick={() => setAddingGallery(true)}>+ New Gallery</button>
            </div>

            <div className="row mb-4 g-3">
                <div className="col-md-6">
                    <input type="text" className="form-control bg-light border-0 shadow-sm p-2" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
                </div>
                <div className="col-md-3">
                    <select className="form-select bg-light border-0 shadow-sm p-2" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="">All Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
                <div className="col-md-3">
                     {selected.length > 0 && <button className="btn btn-danger w-100 shadow-sm" onClick={handleBulkDelete}>Bulk Delete ({selected.length})</button>}
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover align-middle border">
                    <thead className="table-light text-secondary text-uppercase small fw-bold">
                        <tr>
                            <th width="40">#</th>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Previews</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map(g => (
                            <tr key={g.id}>
                                <td><input type="checkbox" className="form-check-input" checked={selected.includes(g.id)} onChange={() => toggleSelect(g.id)} /></td>
                                <td className="text-muted">{g.id}</td>
                                <td>
                                    <div className="fw-bold">{g.title}</div>
                                    <div className="small text-muted">{g.description}</div>
                                </td>
                                <td>
                                    <div className="d-flex">
                                        {g.images?.slice(0, 3).map((img, i) => <img key={i} src={`/storage/${img}`} width="35" height="35" className="me-1 rounded border shadow-sm" />)}
                                        {g.images?.length > 3 && <span className="badge bg-light text-dark border align-self-center">+{g.images.length - 3}</span>}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge rounded-pill ${g.status ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                        {g.status ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="text-end">
                                    <button className="btn btn-sm btn-outline-warning me-2" onClick={() => setEditingGallery(g)}>Edit</button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(g.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="text-muted small">Total: {filtered.length} entries</div>
                <nav>
                    <ul className="pagination pagination-sm m-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                        </li>
                        <li className="page-item active"><span className="page-link">{currentPage}</span></li>
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}

const rootElement = document.getElementById('app');
if (rootElement) {
    createRoot(rootElement).render(<GalleryIndex galleries={window.galleriesData || []} />);
}
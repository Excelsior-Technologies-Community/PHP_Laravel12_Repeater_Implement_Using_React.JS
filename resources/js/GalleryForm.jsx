import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

/** ------------------- Gallery Form ------------------- */
function GalleryForm({ gallery, onBack }) {
    const [title, setTitle] = useState(gallery?.title ?? '');
    const [description, setDescription] = useState(gallery?.description ?? '');
    const [status, setStatus] = useState(gallery?.status ?? 1);
    const [images, setImages] = useState(
        gallery?.images?.map(img => ({ type: 'existing', value: img })) || [{ type: 'new', value: null, preview: null }]
    );

    const addImage = () => setImages([...images, { type: 'new', value: null, preview: null }]);
    const removeImage = (i) => setImages(images.filter((_, index) => index !== i));

    const handleNewFileChange = (e, index) => {
        const file = e.target.files[0];
        const updated = [...images];
        updated[index] = { type: 'new', value: file, preview: URL.createObjectURL(file) };
        setImages(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        e.target.submit();
    };

    return (
        <div className="card shadow-sm p-4 mb-4">
            <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
                ← Back to Gallery List
            </button>

            <h3 className="mb-4">{gallery ? 'Edit Gallery' : 'Create Gallery'}</h3>

            <form
                method="POST"
                action={gallery ? `/gallery/${gallery.id}/update` : '/gallery/store'}
                encType="multipart/form-data"
                onSubmit={handleSubmit}
            >
                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]').content} />

                <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input type="text" name="title" value={title} onChange={e => setTitle(e.target.value)} className="form-control" placeholder="Enter gallery title" />
                </div>

                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea name="description" value={description} onChange={e => setDescription(e.target.value)} className="form-control" placeholder="Enter gallery description" rows="3"></textarea>
                </div>

                <div className="mb-3">
                    <label className="form-label">Images</label>
                    {images.map((imgObj, index) => (
                        <div key={index} className="d-flex align-items-center mb-2">
                            <input type="file" name="images[]" className="form-control" onChange={e => handleNewFileChange(e, index)} />
                            {imgObj.type === 'existing' && <img src={`/storage/${imgObj.value}`} width="60" className="ms-3 rounded border" />}
                            {imgObj.type === 'new' && imgObj.preview && <img src={imgObj.preview} width="60" className="ms-3 rounded border" />}
                            <button type="button" className="btn btn-danger btn-sm ms-3" onClick={() => removeImage(index)}>Remove</button>
                            {imgObj.type === 'existing' && <input type="hidden" name="existing_images[]" value={imgObj.value} />}
                        </div>
                    ))}
                    <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={addImage}>+ Add Image</button>
                </div>

                <div className="mb-4">
                    <label className="form-label">Status</label>
                    <select name="status" value={status} className="form-select" onChange={e => setStatus(e.target.value)}>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary">{gallery ? 'Update Gallery' : 'Save Gallery'}</button>
            </form>
        </div>
    );
}

/** ------------------- Gallery Index ------------------- */
function GalleryIndex({ galleries }) {
    const [list, setList] = useState(galleries);
    const [editingGallery, setEditingGallery] = useState(null);
    const [addingGallery, setAddingGallery] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selected, setSelected] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 4;

    const toggleSelect = (id) => selected.includes(id) ? setSelected(selected.filter(s => s !== id)) : setSelected([...selected, id]);

    const handleDelete = (id) => {
        if (!confirm('Are you sure to delete?')) return;
        setList(list.filter(g => g.id !== id));
        setSelected(selected.filter(s => s !== id));

        fetch(`/gallery/${id}/delete`, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content } });
    };

    const handleBulkDelete = () => {
        if (!confirm(`Delete ${selected.length} selected galleries?`)) return;
        setList(list.filter(g => !selected.includes(g.id)));
        selected.forEach(id => fetch(`/gallery/${id}/delete`, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content } }));
        setSelected([]);
    };

    const filtered = list
        .filter(g => g.title.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase()))
        .filter(g => statusFilter === '' || g.status.toString() === statusFilter);

    const totalPages = Math.ceil(filtered.length / perPage);
    const displayed = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    if (addingGallery) return <GalleryForm gallery={null} onBack={() => setAddingGallery(false)} />;
    if (editingGallery) return <GalleryForm gallery={editingGallery} onBack={() => setEditingGallery(null)} />;

    return (
        <div className="card shadow-sm p-4">
            <h2 className="mb-4">Gallery List</h2>

            <div className="row mb-3 g-2">
                <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="Search by title or description..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="">All Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="mb-3 d-flex align-items-center">
                {selected.length > 0 && <button className="btn btn-danger me-2" onClick={handleBulkDelete}>Delete Selected ({selected.length})</button>}
                <button className="btn btn-primary" onClick={() => setAddingGallery(true)}>+ Add Gallery</button>
            </div>

            <table className="table table-hover table-bordered align-middle text-center">
                <thead className="table-light">
                    <tr>
                        <th>Select</th>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Images</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {displayed.map(g => (
                        <tr key={g.id}>
                            <td><input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggleSelect(g.id)} /></td>
                            <td>{g.id}</td>
                            <td>{g.title}</td>
                            <td>{g.description}</td>
                            <td>{g.images?.map((img, i) => <img key={i} src={`/storage/${img}`} width="60" className="me-1 rounded border" />)}</td>
                            <td>{g.status ? 'Active' : 'Inactive'}</td>
                            <td>
                                <button className="btn btn-warning btn-sm me-2" onClick={() => setEditingGallery(g)}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="d-flex justify-content-between mt-3">
                <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                <span className="align-self-center">Page {currentPage} of {totalPages}</span>
                <button className="btn btn-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
            </div>
        </div>
    );
}

/** ------------------- Render React ------------------- */
createRoot(document.getElementById('app')).render(
    <GalleryIndex galleries={window.galleriesData} />
);
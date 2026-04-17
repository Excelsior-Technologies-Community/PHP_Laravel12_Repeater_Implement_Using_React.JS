<!DOCTYPE html>
<html>
<head>
    <title>React Repeater Form</title>

    <meta name="csrf-token" content="{{ csrf_token() }}">

    @viteReactRefresh
    @vite('resources/js/GalleryForm.jsx')

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>

<div class="container mt-4">
    <div id="app"></div>
</div>

<script>
    // Pass all galleries data to React
    window.galleriesData = @json($galleries ?? []);

    // Pass single gallery data for edit (if any)
    window.galleryData = @json($gallery ?? null);
</script>

</body>
</html>
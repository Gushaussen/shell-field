# Shell Field

Static browser app for approximate shell point clouds from paired interior/exterior photos. Deploy the repository to Vercel with framework preset Other, no build command, and root output directory.

Workflow: upload both photographs; trace and close an outer polygon on each; optionally add closed hole polygons; pick base and tip on the interior photo; enter the corresponding physical straight-line measurement in mm; build; inspect; export binary colored PLY. Changing physical length scales every coordinate uniformly without resampling. Display mode does not change exported photographic colors.

Geometry is an estimate: convex dome profiles, approximate bounding-box alignment, optional brightness relief and connecting edge samples. It is not photogrammetry. Perspective, photo angle and overlap errors affect calibration and correspondence. Only points in overlapping mapped masks are sampled, so mismatches may truncate surfaces. Use comparable near-top-down photographs. Outer matching can be mirrored and rotated manually. No automatic segmentation or local shape sculpting in this version.

Settings JSON is an export-only record, not a reopenable project. Original photos are not embedded. Images are processed locally; Three.js modules are fetched from jsDelivr. Browser graphics and end-to-end deployment require validation after deployment. This source has not yet been browser-tested.

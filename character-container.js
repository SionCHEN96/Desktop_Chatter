
loader.load(
    'Lina_VRM.vrm',
    (gltf) => {
        vrm = gltf.userData.vrm;
        if (!vrm) {
            console.error('未能在 gltf.userData.vrm 中找到 VRM 模型');
            return;
        }
        vrm.scene.scale.set(3.0, 3.0, 3.0); // Increase scale from 1.5 to 3.0 to make model twice as large
        vrm.scene.position.set(0, -2, 0); // 下移模型位置
        vrm.scene.rotation.y = Math.PI; // 让模型正对摄像机
        scene.add(vrm.scene);
        console.log('VRM 加载完成', vrm);
        // 输出所有 mesh 的材质信息
        vrm.scene.traverse((obj) => {
            if (obj.isMesh) {
                console.log('Mesh:', obj.name, 'Material:', obj.material);
            }
        });
    },
    (progress) => {
        const percent = progress.total
            ? (100.0 * (progress.loaded / progress.total)).toFixed(2)
            : '...';
        console.log('Loading model...', percent, '%');
    },
    (error) => console.error('Error loading VRM model:', error)
);

// 调整相机位置
camera.position.set(0, 3, 4); // 调整相机位置，使其更远更高
camera.lookAt(0, 0, 0); // 看向模型中心

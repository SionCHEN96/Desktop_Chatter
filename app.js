async function init() {
    // 加载VRM模型
    loadVRMModel();

    // 开始渲染循环
    animate();
}

function loadVRMModel() {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    // 注意：模型路径需要正确指向public/models目录下的模型文件
    loader.load('./public/models/Lina_VRM.vrm', (gltf) => {
        vrm = gltf.userData.vrm;

        // 获取容器的实际尺寸
        const containerWidth = characterContainer.clientWidth;
        const containerHeight = characterContainer.clientHeight;

        // 假设模型原始尺寸为1单位长度，根据容器尺寸计算缩放比例
        const scale = Math.min(containerWidth / 400, containerHeight / 600); // 根据实际情况调整400和600

        // 调整模型位置和缩放
        vrm.scene.rotation.y = Math.PI;
        // 增加模型缩放比例，使其更适合显示区域
        vrm.scene.scale.set(scale, scale, scale);
        scene.add(vrm.scene);

        // 移除重复的相机位置设置，保持在init函数中统一设置
    }, undefined, (error) => {
        console.error('加载VRM模型时出错:', error);
    });
}
import { useEffect, useRef, useState } from 'react';

interface HeroAvatar3DProps {
  avatarUrl: string;
  altText?: string;
}

export function HeroAvatar3D({ avatarUrl, altText = 'Lakshya illustrated avatar' }: HeroAvatar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let disposed = false;
    let frameId = 0;
    let cleanupFns: (() => void)[] = [];

    // Dynamically import Three.js so initial page load & text hero paint immediately
    (async () => {
      try {
        const THREE = await import('three');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        if (disposed || !container) return;

        const isSoftwareGl = (() => {
          try {
            const probe = document.createElement('canvas');
            const gl = probe.getContext('webgl2') || probe.getContext('webgl');
            if (!gl) return true;
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
            const gpu = String(gl.getParameter(param) || '');
            gl.getExtension('WEBGL_lose_context')?.loseContext();
            return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
          } catch {
            return true;
          }
        })();

        const width = container.clientWidth || 380;
        const height = container.clientHeight || 380;

        const renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTex;
        pmrem.dispose();

        const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
        camera.position.set(0, 0, 6.75);

        // Warm key light + cool fill light
        const hemiLight = new THREE.HemisphereLight(0xdbe4ff, 0xf2a77f, 1.15);
        scene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xfff4ea, 1.35);
        keyLight.position.set(3.5, 4.5, 5.5);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xa5a0f5, 0.9);
        rimLight.position.set(-4, -2, 3);
        scene.add(rimLight);

        // Composite hero group: 3D orbital ribbons & geometric studio accents framing the avatar
        const orbitGroup = new THREE.Group();
        scene.add(orbitGroup);

        const periwinkleMat = new THREE.MeshPhysicalMaterial({
          color: 0x304a96,
          roughness: 0.32,
          metalness: 0.12,
          clearcoat: 0.5,
        });
        const peachMat = new THREE.MeshPhysicalMaterial({
          color: 0xf2a77f,
          roughness: 0.25,
          metalness: 0.08,
          clearcoat: 0.6,
        });
        const lavenderMat = new THREE.MeshPhysicalMaterial({
          color: 0xa5a0f5,
          roughness: 0.45,
          metalness: 0.1,
          clearcoat: 0.4,
        });
        const navyMat = new THREE.MeshPhysicalMaterial({
          color: 0x18264f,
          roughness: 0.58,
          metalness: 0.2,
        });

        // Curved outer orbital arc 1 (peach)
        const arcGeo1 = new THREE.TorusGeometry(1.78, 0.042, 16, 48, Math.PI * 0.55);
        const arc1 = new THREE.Mesh(arcGeo1, peachMat);
        arc1.rotation.z = Math.PI * 0.62;
        arc1.rotation.x = 0.24;
        orbitGroup.add(arc1);

        // Curved outer orbital arc 2 (lavender)
        const arcGeo2 = new THREE.TorusGeometry(1.86, 0.036, 16, 48, Math.PI * 0.48);
        const arc2 = new THREE.Mesh(arcGeo2, lavenderMat);
        arc2.rotation.z = -Math.PI * 0.35;
        arc2.rotation.y = 0.28;
        orbitGroup.add(arc2);

        // Thin precision back ring (periwinkle)
        const backRingGeo = new THREE.TorusGeometry(1.62, 0.018, 12, 64);
        const backRing = new THREE.Mesh(backRingGeo, periwinkleMat);
        backRing.position.z = -0.25;
        orbitGroup.add(backRing);

        // Tactile bevelled studio nodes along the perimeter
        const nodeGeo = new THREE.IcosahedronGeometry(0.11, 1);
        const node1 = new THREE.Mesh(nodeGeo, peachMat);
        node1.position.set(1.56, 0.92, 0.25);
        orbitGroup.add(node1);

        const nodeGeo2 = new THREE.CylinderGeometry(0.085, 0.085, 0.06, 24);
        const node2 = new THREE.Mesh(nodeGeo2, navyMat);
        node2.position.set(-1.55, -0.78, 0.22);
        node2.rotation.x = Math.PI / 2.4;
        orbitGroup.add(node2);

        // Mouse tracking target (desktop)
        const pointer = { x: 0, y: 0 };
        const onPointerMove = (e: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
          pointer.x = THREE.MathUtils.clamp(nx, -1, 1);
          pointer.y = THREE.MathUtils.clamp(ny, -1, 1);
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });

        const onResize = () => {
          if (!container) return;
          const w = container.clientWidth || 380;
          const h = container.clientHeight || 380;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        if (!isSoftwareGl) {
          renderer.compile(scene, camera);
        }

        setWebglReady(true);

        const afterDraw = (cb: () => void) => {
          const gl = renderer.getContext() as WebGL2RenderingContext;
          if (!gl || typeof gl.fenceSync !== 'function') {
            frameId = window.setTimeout(cb, 90);
            return;
          }
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) return;
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
        };

        let lastTime = performance.now();
        let elapsed = 0;

        const tick = () => {
          if (disposed) return;
          const now = performance.now();
          const dt = Math.min((now - lastTime) / 1000, 0.1);
          lastTime = now;
          elapsed += dt;

          if (!prefersReducedMotion) {
            orbitGroup.position.y = Math.sin(elapsed * 1.4) * 0.07;
            arc1.rotation.z = Math.PI * 0.62 + Math.sin(elapsed * 0.5) * 0.08;
            arc2.rotation.z = -Math.PI * 0.35 - Math.cos(elapsed * 0.45) * 0.08;
            node1.rotation.y += dt * 0.8;
            node2.rotation.z += dt * 0.6;

            orbitGroup.rotation.y = THREE.MathUtils.damp(
              orbitGroup.rotation.y,
              pointer.x * 0.22,
              4,
              dt,
            );
            orbitGroup.rotation.x = THREE.MathUtils.damp(
              orbitGroup.rotation.x,
              -pointer.y * 0.16,
              4,
              dt,
            );
          }

          renderer.render(scene, camera);

          if (prefersReducedMotion) return; // Render once for reduced motion
          if (isSoftwareGl) {
            afterDraw(tick);
          } else {
            frameId = requestAnimationFrame(tick);
          }
        };

        tick();

        cleanupFns = [
          () => window.removeEventListener('pointermove', onPointerMove),
          () => window.removeEventListener('resize', onResize),
          () => {
            cancelAnimationFrame(frameId);
            clearTimeout(frameId);
            arcGeo1.dispose();
            arcGeo2.dispose();
            backRingGeo.dispose();
            nodeGeo.dispose();
            nodeGeo2.dispose();
            periwinkleMat.dispose();
            peachMat.dispose();
            lavenderMat.dispose();
            navyMat.dispose();
            envTex.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === container) {
              container.removeChild(renderer.domElement);
            }
          },
        ];
      } catch {
        // Cleanly fall back to pure SVG + CSS circular avatar
        setWebglReady(false);
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <div
      data-testid="hero-avatar-stage"
      data-webgl={webglReady ? 'active' : 'fallback'}
      className="relative w-[270px] h-[270px] sm:w-[310px] sm:h-[310px] lg:w-[330px] lg:h-[330px] mx-auto lg:mx-0 flex items-center justify-center select-none"
    >
      {/* Subtle decorative backdrop ring visible immediately even before/without WebGL */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <circle
          cx="200"
          cy="200"
          r="158"
          fill="none"
          stroke="#A5A0F5"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeDasharray="10 10"
        />
        <path
          d="M 54 150 A 155 155 0 0 1 160 50"
          fill="none"
          stroke="#F2A77F"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M 346 250 A 155 155 0 0 1 240 350"
          fill="none"
          stroke="#A5A0F5"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </svg>

      {/* Circular Avatar Portrait */}
      <div className="relative z-10 w-[72%] h-[72%] rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#304A96] transition-transform duration-500 hover:scale-[1.02]">
        <img
          src={avatarUrl}
          alt={altText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Isolated Three.js Orbital Layer */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="absolute inset-0 z-20 pointer-events-none"
      />
    </div>
  );
}

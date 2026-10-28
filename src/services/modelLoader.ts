import * as THREE from 'three';
import type { AtlasManifest, Part, BiologicalSex } from '../types/anatomy';
import { getHighDetailGeometry } from './highDetailAnatomy';
import { applyFemaleMorph, applyFemaleSurface } from '../utils/anthropometry';

// Memory cache for decoded binary chunk ArrayBuffers
const chunkCache = new Map<number, ArrayBuffer>();

export async function fetchManifest(): Promise<AtlasManifest> {
  const response = await fetch('/models/atlas.json');
  if (!response.ok) {
    throw new Error(`Failed to load anatomical atlas manifest (${response.status})`);
  }
  return await response.json();
}

/**
 * Loads a binary chunk file, handling transparent gzip decompression if needed.
 */
export async function loadChunk(
  chunkIndex: number,
  manifest: AtlasManifest,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  if (chunkCache.has(chunkIndex)) {
    return chunkCache.get(chunkIndex)!;
  }

  const chunkInfo = manifest.chunks[chunkIndex];
  if (!chunkInfo) {
    throw new Error(`Chunk ${chunkIndex} not found in atlas manifest`);
  }

  const useGzip = !!chunkInfo.gzip && typeof DecompressionStream !== 'undefined';
  const url = useGzip ? chunkInfo.gzip! : chunkInfo.url;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to download anatomy binary chunk ${chunkIndex} from ${url}`);
  }

  const payload = await response.arrayBuffer();
  const sig = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const isGzip = useGzip && sig[0] === 0x1f && sig[1] === 0x8b;

  let buffer: ArrayBuffer;
  if (isGzip) {
    const stream = new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip')));
    buffer = await stream.arrayBuffer();
  } else {
    buffer = payload;
  }

  if (buffer.byteLength !== chunkInfo.bytes) {
    // If gzip decompression mismatch, try raw payload
    if (payload.byteLength === chunkInfo.bytes) {
      buffer = payload;
    }
  }

  chunkCache.set(chunkIndex, buffer);
  return buffer;
}

/**
 * Extracts a standalone THREE.BufferGeometry for an individual anatomical part.
 * Prioritizes high-detail regional/inspection representations when available,
 * falling back to authentic source mesh binary geometry.
 */
export async function createStandalonePartGeometry(
  part: Part,
  manifest: AtlasManifest,
  sex: BiologicalSex = 'male'
): Promise<THREE.BufferGeometry> {
  // Check for enhanced high-resolution inspection model first
  const highDetail = getHighDetailGeometry(part);
  if (highDetail) {
    if (sex === 'female') {
      const positions = highDetail.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let m = applyFemaleMorph(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i),
          1.0,
          part.system === 'muscular'
        );
        if (part.id === 'FJ2810' || part.id.startsWith('F_AREOLA') || part.id.startsWith('F_NIPPLE')) {
          m = applyFemaleSurface(m.x, m.y, m.z, 1.0);
        }
        positions.setXYZ(i, m.x, m.y, m.z);
      }
      positions.needsUpdate = true;
      highDetail.computeVertexNormals();
      highDetail.computeBoundingBox();
      highDetail.computeBoundingSphere();
    }
    return highDetail;
  }

  const buffer = await loadChunk(part.chunk, manifest);

  const geom = new THREE.BufferGeometry();

  // Positions: 3 floats per vertex (12 bytes per vertex)
  const srcPositions = new Float32Array(buffer, part.positions, part.vertexCount * 3);
  const positions = new Float32Array(srcPositions.length);
  positions.set(srcPositions);

  if (sex === 'female') {
    const isMuscle = part.system === 'muscular';
    for (let i = 0; i < part.vertexCount; i++) {
      const x = positions[i * 3 + 0];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      let m = applyFemaleMorph(x, y, z, 1.0, isMuscle);
      if (part.id === 'FJ2810' || part.id.startsWith('F_AREOLA') || part.id.startsWith('F_NIPPLE')) {
        m = applyFemaleSurface(m.x, m.y, m.z, 1.0);
      }
      positions[i * 3 + 0] = m.x;
      positions[i * 3 + 1] = m.y;
      positions[i * 3 + 2] = m.z;
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Normals: quantized signed 16-bit integers (normalized to [-1, 1])
  const normals = new Int16Array(buffer, part.normals, part.vertexCount * 3);
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3, true));

  if (sex === 'female') {
    geom.computeVertexNormals();
  }

  // Indices: 32-bit unsigned integers
  const indices = new Uint32Array(buffer, part.indices, part.indexCount);
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  return geom;
}

/**
 * Disposes all cached chunk buffers and GPU resources when needed.
 */
export function purgeChunkCache(): void {
  chunkCache.clear();
}



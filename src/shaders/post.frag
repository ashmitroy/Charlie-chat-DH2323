#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;

void main() {
  vec2 uv = vTexCoord;
  vec2 texel = 1.0 / uResolution;

  vec3 base = texture2D(uScene, uv).rgb;

  // Bloom: 9-tap box sample around this pixel, keeping only what's above a
  // 0.3 brightness threshold so bright areas bleed into their neighbours
  // without lifting the whole image.
  vec3 bloom = vec3(0.0);
  float spread = 3.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) * texel * spread;
      vec3 s = texture2D(uScene, uv + offset).rgb;
      bloom += max(s - 0.3, 0.0);
    }
  }
  bloom /= 9.0;

  // Boost exposure before compressing it back down, so highlights actually
  // have somewhere to fall from.
  vec3 color = base * 1.8 + bloom * 0.8;

  // Reinhard tone mapping (Reinhard et al. 2002): color / (1 + color) maps
  // the boosted HDR-ish range back into 0..1 without hard-clipping highlights.
  color = color / (1.0 + color);

  // Shadow-tint colour grade: darker areas get pulled toward a cold near-black
  // tint instead of pure black, brighter areas stay closer to their true colour.
  color = mix(vec3(0.04, 0.03, 0.10), color, clamp(color * 1.5, 0.0, 1.0));

  // Vignette: darken the frame edges via a smoothstep falloff from screen centre.
  float vignette = 1.0 - smoothstep(0.4, 0.85, length(uv - 0.5));
  color *= vignette;

  // Hash-based film grain, applied last (after tone mapping) so it isn't
  // itself compressed back down in the highlights.
  float grain = fract(sin(dot(uv + fract(uTime * 0.01), vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.06;

  gl_FragColor = vec4(color, 1.0);
}

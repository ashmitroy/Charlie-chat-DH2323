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

  vec3 color = base * 1.8 + bloom * 0.8;

  color = color / (1.0 + color);

  color = mix(vec3(0.04, 0.03, 0.10), color, clamp(color * 1.5, 0.0, 1.0));

  float vignette = 1.0 - smoothstep(0.4, 0.85, length(uv - 0.5));
  color *= vignette;

  float grain = fract(sin(dot(uv + fract(uTime * 0.01), vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.06;

  gl_FragColor = vec4(color, 1.0);
}

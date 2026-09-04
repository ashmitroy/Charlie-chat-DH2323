#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
uniform sampler2D uHeightMap;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uFlat; // 1.0 = flat/unlit comparison condition for the user study

// The height map doubles as a material map: distinct value bands (set in
// buildHeightMap) mean "this pixel is wall / rug / plant / etc." Gradients
// between bands still drive the Sobel normal below, but the raw value also
// picks the albedo, so materials read as different even where both are flat.
vec3 materialColor(float h) {
  if (h < 0.2157) return vec3(0.35, 0.20, 0.12); // furniture
  if (h < 0.2941) return vec3(0.55, 0.30, 0.18); // plant pot
  if (h < 0.3725) return vec3(0.16, 0.38, 0.20); // plant leaves
  if (h < 0.4510) return vec3(0.62, 0.52, 0.45); // wall
  if (h < 0.5294) return vec3(0.30, 0.22, 0.15); // photo frame
  if (h < 0.5980) return vec3(0.45, 0.16, 0.14); // rug border
  if (h < 0.6569) return vec3(0.62, 0.30, 0.22); // rug body
  if (h < 0.7157) return vec3(0.30, 0.20, 0.12); // floor groove
  if (h < 0.8529) return vec3(0.62, 0.46, 0.30); // floor plank
  return vec3(0.85, 0.80, 0.70);                  // door
}

void main() {
  vec2 texel = 1.0 / uResolution;

  float tl = texture2D(uHeightMap, vTexCoord + vec2(-texel.x,  texel.y)).r;
  float t  = texture2D(uHeightMap, vTexCoord + vec2(     0.0,  texel.y)).r;
  float tr = texture2D(uHeightMap, vTexCoord + vec2( texel.x,  texel.y)).r;
  float l  = texture2D(uHeightMap, vTexCoord + vec2(-texel.x,      0.0)).r;
  float c  = texture2D(uHeightMap, vTexCoord).r;
  float r  = texture2D(uHeightMap, vTexCoord + vec2( texel.x,      0.0)).r;
  float bl = texture2D(uHeightMap, vTexCoord + vec2(-texel.x, -texel.y)).r;
  float b  = texture2D(uHeightMap, vTexCoord + vec2(     0.0, -texel.y)).r;
  float br = texture2D(uHeightMap, vTexCoord + vec2( texel.x, -texel.y)).r;

  float Gx = (-tl - 2.0*l - bl + tr + 2.0*r + br) * 0.1;
  float Gy = ( tl + 2.0*t + tr  - bl - 2.0*b - br) * 0.1;

  vec3 normal = normalize(vec3(-Gx, -Gy, 1.0));
  vec3 lightPos = vec3(uMouse, 0.5);
  vec3 lightDir = normalize(lightPos - vec3(vTexCoord, 0.0));

  float NdotL = max(dot(normal, lightDir), 0.0);

  float dist = length(uMouse - vTexCoord);
  float attenuation = 1.0 / (1.0 + 6.0 * dist * dist);

  vec3 albedo = materialColor(c);
  vec3 color;
  if (uFlat > 0.5) {
    color = albedo * 0.6; // flat ambient only — no N·L term, no falloff
  } else {
    float lightAmount = 0.18 + NdotL * attenuation;
    color = albedo * lightAmount;
  }

  gl_FragColor = vec4(color, 1.0);
}

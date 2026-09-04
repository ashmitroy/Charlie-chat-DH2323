#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
uniform vec2 uResolution;
uniform vec2 uLight;
uniform vec2 uCharlie;
uniform float uRadius;

// All distance math below runs in pixel space, not raw 0–1 UV space. The
// canvas is 960x540, not square, so a "unit" in UV x spans uResolution.x
// pixels while a unit in UV y spans uResolution.y pixels — SDF distances
// computed directly against UV coordinates come out stretched along
// whichever axis is longer. Pixel space is isotropic (1px = 1px on both
// axes), so a box stays a box and a circle stays a circle.
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Static furniture occluders, in pixel coordinates matching buildHeightMap()
// (main.js) exactly — they never move, so no uniforms needed for them.
float furnitureSDF(vec2 p) {
  float d = sdBox(p - vec2(810.0, 130.0), vec2(50.0, 40.0)); // armchair
  d = min(d, sdBox(p - vec2(710.0, 130.0), vec2(20.0, 20.0))); // side table
  d = min(d, length(p - vec2(110.0, 400.0)) - 48.0);           // plant, left
  d = min(d, length(p - vec2(830.0, 400.0)) - 48.0);           // plant, right
  return d;
}

float charlieSDF(vec2 p) {
  return length(p - uCharlie * uResolution) - uRadius * uResolution.x;
}

// Same Quilez soft-shadow raymarch [3], parameterised by which SDF to
// march against so Charlie and the furniture can get different treatment.
float raymarch(vec2 p0, vec2 lightPx, bool isFurniture) {
  vec2 toLight = lightPx - p0;
  float totalDist = length(toLight);
  vec2 dir = normalize(toLight);

  float t = 1.0;
  float shadow = 1.0;

  for (int i = 0; i < 64; i++) {
    vec2 p = p0 + dir * t;
    float h = isFurniture ? furnitureSDF(p) : charlieSDF(p);

    if (h < 0.0) { shadow = 0.0; break; }

    shadow = min(shadow, 8.0 * h / t);

    t += max(h, 1.0);
    if (t >= totalDist) break;
  }
  return shadow;
}

void main() {
  vec2 p0     = vTexCoord * uResolution;
  vec2 lightPx = uLight * uResolution;

  float shadowCharlie = raymarch(p0, lightPx, false);

  // A pixel sitting on (or right at the edge of) the furniture itself is
  // inside its own SDF, so a naive shadow test there immediately reads
  // "blocked" — the object would shadow itself. Only test pixels that are
  // clearly out on the floor; the object's own surface just stays lit by
  // whatever the N·L pass already gave it.
  float shadowFurniture = 1.0;
  if (furnitureSDF(p0) > 3.0) {
    shadowFurniture = raymarch(p0, lightPx, true);
    shadowFurniture = max(shadowFurniture, 0.6); // furniture shadows stay light
  }

  float shadow = min(shadowCharlie, shadowFurniture);
  gl_FragColor = vec4(vec3(shadow), 1.0);
}

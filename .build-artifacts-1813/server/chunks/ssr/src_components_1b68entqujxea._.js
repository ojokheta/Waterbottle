(()=>{"use strict";module.exports=[64224,a=>{var b=a.i(87924),c=a.i(72131);let d=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,e=`#version 300 es
precision highp float;
uniform sampler2D uLogo;
uniform sampler2D uText;
uniform vec2 uResolution;
uniform float uDpr;
uniform float uUnit;
uniform vec2 uLogoBox;
uniform vec2 uTextBox;
uniform float uTextWidth;
uniform float uTime;
uniform float uSettle;
uniform float uArtScale;
uniform float uWordmarkEnabled;
uniform vec3 uTile;
uniform float uTileEnabled;
// 0 on a dark page, 1 on a pale one.
uniform float uPageLight;
uniform float uDepth;
uniform float uDispersion;
uniform float uRelief;
uniform float uCaustics;
uniform float uHighlights;
// How much the faint line outside the rim takes the plate color.
uniform float uEchoTint;
// 0 draws the full inner wall; 1 keeps it to the upper-left and lower-right arcs.
uniform float uInnerWallFocus;
uniform float uDropSize;
uniform float uDropStrength;
uniform float uDecay;
// Second drop: radius, core radius, rim stretch, center factor (negative inverts).
uniform vec4 uDrop;
// Second drop: core edge magnification, profile exponent, ripple amplitude, wavelength.
uniform vec4 uDropLens;
// Second drop: ripple phase, share of ripples inside the core, dispersion, unused.
uniform vec4 uDropWave;
out vec4 outColor;
const float PI = 3.14159265359;
const int BANDS = 32;

float sq(float x) { return x * x; }
float bell(float x, float width) { return exp(-sq(x / max(width, 0.001))); }
float ease(float a, float b, float x) { return smoothstep(a, b, x); }

// Smooth overlapping spectral sensitivities, normalized in the integration below.
vec3 spectrum(float s) {
  float wavelength = 400.0 + 300.0 * s;
  vec3 rgb = vec3(0.0);
  if (wavelength < 440.0) rgb = vec3((440.0 - wavelength) / 120.0, 0.0, 1.0);
  else if (wavelength < 490.0) rgb = vec3(0.0, (wavelength - 440.0) / 50.0, 1.0);
  else if (wavelength < 510.0) rgb = vec3(0.0, 1.0, (510.0 - wavelength) / 20.0);
  else if (wavelength < 580.0) rgb = vec3((wavelength - 510.0) / 70.0, 1.0, 0.0);
  else if (wavelength < 645.0) rgb = vec3(1.0, (645.0 - wavelength) / 65.0, 0.0);
  else rgb = vec3(1.0, 0.0, 0.0);
  return rgb * mix(0.2, 1.0, ease(400.0, 430.0, wavelength)) * mix(1.0, 0.65, ease(650.0, 700.0, wavelength));
}
float glassIor(float s, float spread) {
  float wavelength = 0.4 + 0.3 * s;
  return 1.38 + (0.04 / (wavelength * wavelength) - 0.12) * spread;
}

vec4 imageAt(sampler2D image, vec2 p, vec2 box) {
  vec2 uv = 0.5 + p / box;
  // Transparent outside the image, including images that touch their texture edges.
  // Explicit LOD is stable inside the back-face branch; implicit derivatives are
  // undefined there and can make the same sought frame change after another draw.
  vec2 footprint = vec2(textureSize(image, 0)) / max(box * uDpr, vec2(1.0));
  float lod = max(0.0, log2(max(footprint.x, footprint.y)));
  // The first sphere comes into focus as it flattens into a plate.
  lod += (1.0 - ease(0.20, 0.36, uTime)) * 2.2;
  vec4 ink = textureLod(image, uv, lod);
  return ink * step(0.0, uv.x) * step(0.0, uv.y) * step(uv.x, 1.0) * step(uv.y, 1.0);
}

float superRadius(vec2 p, float n) {
  vec2 a = max(abs(p), vec2(0.00001));
  return pow(pow(a.x, n) + pow(a.y, n), 1.0 / n);
}
vec2 superNormal(vec2 p, float n) {
  return normalize(sign(p) * pow(max(abs(p), vec2(0.00001)), vec2(n - 1.0)) + vec2(0.000001));
}

float hash1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }

// Real glass is not a perfect stroke. Along an edge (u = arc length in pixels) its
// light varies slowly and breaks into short glints where the surface is uneven.
float contourNoise(float u) {
  float i = floor(u);
  float f = fract(u);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash1(i), hash1(i + 1.0), f);
}
float specks(float u, float d, float size, float seed) {
  float spacing = size * 22.0;
  float cell = floor(u / spacing);
  float on = step(0.7, hash1(cell + seed));
  float center = (cell + 0.2 + 0.6 * hash1(cell + seed + 17.0)) * spacing;
  float offset = (hash1(cell + seed + 31.0) - 0.5) * size * 0.6;
  // Glints are dashes along the edge, several times longer than they are wide.
  float dash = size * (2.5 + 4.0 * hash1(cell + seed + 53.0));
  return on * bell(u - center, dash) * bell(d - offset, size * 0.35);
}
// The same glints as particles held by the liquid: each one bobs across the edge
// on its own period and barely sways along it, so nothing slides sideways.
// Neighboring cells are included so a moving glint is not clipped at its cell.
float driftingSpecks(float u, float d, float size, float seed, float t) {
  float spacing = size * 22.0;
  float cell = floor(u / spacing);
  float glints = 0.0;
  for (int j = -1; j <= 1; j++) {
    float id = cell + float(j);
    float on = step(0.7, hash1(id + seed));
    float rate = 2.5 + 3.0 * hash1(id + seed + 71.0);
    float phase = 6.2832 * hash1(id + seed + 89.0);
    float center = (id + 0.2 + 0.6 * hash1(id + seed + 17.0)) * spacing + sin(t * rate * 0.5 + phase) * spacing * 0.05;
    float offset = (hash1(id + seed + 31.0) - 0.5) * size * 0.6 + sin(t * rate + phase) * size * 1.6;
    float dash = size * (2.5 + 4.0 * hash1(id + seed + 53.0));
    glints += on * bell(u - center, dash) * bell(d - offset, size * 0.35);
  }
  return min(glints, 1.0);
}

// Material-space relief: neighboring glass walls share the slow undulation but
// have different fine thickness variations. It stays attached as the lens grows.
float edgeWarp(float arc, float seed) {
  float broad = contourNoise(arc / (uUnit * 0.037) + seed) - 0.5;
  float fine = contourNoise(arc / (uUnit * 0.008) + seed + 29.0) - 0.5;
  return uUnit * (broad * 0.0017 + fine * 0.0008);
}

// Small flattened air pockets in the glass channel. x is the dark cavity;
// y is its light-catching lip. Three cells avoid popping at cell boundaries.
vec2 glassPores(float arc, float d, float seed) {
  if (abs(d) > uUnit * 0.011) return vec2(0.0);
  float pitch = uUnit * 0.022;
  float cell = floor(arc / pitch);
  vec2 pores = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    float id = cell + float(j) + seed;
    float visible = step(0.63, hash1(id));
    float center = (cell + float(j) + 0.15 + 0.7 * hash1(id + 17.0)) * pitch;
    float across = (hash1(id + 31.0) - 0.5) * uUnit * 0.009;
    float span = uUnit * (0.0022 + 0.0035 * hash1(id + 53.0));
    float height = max(0.35 / uDpr, uUnit * (0.0007 + 0.0012 * hash1(id + 71.0)));
    vec2 q = vec2((arc - center) / span, (d - across) / height);
    // A slight skew keeps the cavities from forming identical ellipses.
    q.x += q.y * (hash1(id + 89.0) - 0.5) * 0.55;
    float radius = length(q);
    float aa = max(0.18, 0.4 / (uDpr * height));
    float cavity = bell(radius, 0.65);
    float lip = bell(radius - 1.0, aa);
    float glint = 0.25 + 0.75 * max(dot(q / max(radius, 0.001), normalize(vec2(-0.4, 0.8))), 0.0);
    pores += vec2(cavity, lip * glint) * visible;
  }
  return min(pores, vec2(1.0));
}

// Light reflected off the ripples outside the glass is invisible on a pale page.
// There the same ripples bend the page away and read as cool shadows, as in the
// light reference. Coverage is unchanged, so a dark page renders as before.
vec3 exteriorColor(vec3 light, float coverage) {
  // The shadow leans toward the plate's own tone, a little deeper, so it belongs
  // to the glass instead of reading as a gray smudge on the page.
  vec3 shade = mix(vec3(0.40, 0.46, 0.56), uTile * 0.86, uEchoTint);
  return mix(light, shade * coverage, uPageLight);
}

// Per-channel coverage of the last refracted image. Each wavelength band lands
// on the artwork at its own offset, so a dark logo over a light plate blocks red,
// green and blue at slightly different places and its edges split into color.
vec3 refractedCoverage;

// A refracted image behind a glass lens, with a little light focused onto its ink.
vec4 refractedLogo(vec2 p, vec2 normalXY, float lensScale, float glass, float chromaticScale, float surfaceDistance) {
  vec3 normal = normalize(vec3(normalXY, 1.0));
  vec3 color = vec3(0.0);
  vec3 weights = vec3(0.0);
  float alpha = 0.0;
  float minCoverage = 1.0;
  float maxCoverage = 0.0;
  refractedCoverage = vec3(0.0);
  float spread = uDispersion * chromaticScale * mix(0.85, mix(2.2, 1.5, ease(0.28, 0.9, uTime)), ease(0.25, 0.33, uTime));
  vec3 neutralRay = refract(vec3(0.0, 0.0, -1.0), normal, 1.0 / glassIor(0.5, spread));
  vec2 neutralOffset = neutralRay.xy / max(-neutralRay.z, 0.25) * uUnit * uDepth * 0.80 * lensScale;
  for (int i = 0; i < BANDS; i++) {
    float s = float(i) / float(BANDS - 1);
    // Shorter wavelengths bend more. Dispersion is intentionally visible at the bevel.
    // The young sphere splits light only at its rim; the settled bevel splits it strongly.
    float ior = glassIor(s, spread);
    vec3 ray = refract(vec3(0.0, 0.0, -1.0), normal, 1.0 / ior);
    vec2 offset = ray.xy / max(-ray.z, 0.25) * uUnit * uDepth * 0.80 * lensScale;
    // Measured artwork scale over time; see artworkScale in the renderer.
    float artworkScale = uArtScale;
    float magnification = 1.0;
    // The opening focus folds the edge of the image into a partial crescent.
    // It opens into barrel distortion before the sphere flattens into the plate.
    float sphereRadius = uUnit * lensScale * 0.5;
    float sphereFocus = 1.0 - ease(0.225, 0.335, uTime);
    float bubbleQ = min(length(p) / max(sphereRadius, 1.0), 1.0);
    float openingFocus = 1.0 - ease(0.19, 0.265, uTime);
    float focusProfile = mix(0.7 + 0.6 * sq(bubbleQ), 1.0 - 0.9 * sq(bubbleQ), openingFocus);
    vec2 bubbleSample = p * focusProfile + offset * mix(0.35, 0.12, openingFocus);
    bubbleSample += vec2(0.025, 0.10) * uUnit * openingFocus;
    bubbleSample += (offset - neutralOffset) * openingFocus * 1.6;
    vec2 sourcePoint = mix(p + offset, bubbleSample, sphereFocus);
    vec4 ink = imageAt(uLogo, sourcePoint, uLogoBox * artworkScale * magnification);
    // Focus is inside the young dome, leaving clear glass between the enlarged
    // fragment and the rim. The aperture opens as the rest of the logo appears.
    ink *= mix(1.0, 1.0 - ease(0.72, 0.86, bubbleQ), openingFocus);
    // The rim is an optical aperture too. Giving each wavelength its own boundary
    // creates a red/yellow outer edge and cyan/blue inner edge without tinting the ink.
    float edgeShift = (s - 0.5) * uUnit * lensScale * 0.018 * uDispersion * chromaticScale;
    ink *= 1.0 - smoothstep(-0.8 / uDpr, 0.8 / uDpr, surfaceDistance - edgeShift);
    minCoverage = min(minCoverage, ink.a);
    maxCoverage = max(maxCoverage, ink.a);
    vec3 w = spectrum(s);
    color += ink.rgb * w;
    alpha += ink.a * (w.r + w.g + w.b);
    refractedCoverage += ink.a * w;
    weights += w;
  }
  color /= weights;
  refractedCoverage /= weights;
  // A coated glass shoulder has a cooler spectral response at a split image edge.
  // Coverage variance keeps solid areas and original-color artwork free of a tint.
  float coating = ease(-uUnit * lensScale * 0.022, 0.0, surfaceDistance);
  color.g *= 1.0 - 0.65 * coating * (maxCoverage - minCoverage);
  // The young curved face catches a violet interference fringe at internal ink
  // edges. Its outer lip stays cyan; opaque artwork keeps its original color.
  float youngFilm = (maxCoverage - minCoverage) * (1.0 - ease(0.19, 0.30, uTime));
  youngFilm *= 1.0 - ease(-uUnit * lensScale * 0.08, -uUnit * lensScale * 0.025, surfaceDistance);
  color.r += color.b * youngFilm * 0.80;
  color.b += color.r * youngFilm * 0.60;
  color.g *= 1.0 - youngFilm * 0.55;
  alpha /= weights.r + weights.g + weights.b;
  // This lift belongs to the image's edges, not a painted rainbow on the lens.
  float diffuse = max(dot(normal, normalize(vec3(-0.4, 0.6, 1.0))), 0.0);
  vec3 earlyWhite = mix(vec3(0.90, 0.93, 0.95), vec3(0.84, 0.86, 0.89), ease(0.21, 0.40, uTime));
  vec3 whiteBalance = mix(earlyWhite, vec3(0.87, 0.88, 0.885), ease(0.75, 1.22, uTime));
  color *= whiteBalance * ((0.90 + 0.10 * diffuse + glass * uCaustics * 0.04) * ((0.975 + 0.025 * sin(p.y / uUnit * PI)) * (1.0 + 0.09 * ease(0.75, 1.22, uTime) + 0.03 * (1.0 - ease(0.2, 0.5, uTime)))));
  return vec4(color, alpha);
}

vec4 iconLens(vec2 p) {
  float t = uTime;
  float settle = ease(0.0, 1.0, uSettle);
  float enter = ease(0.025, 0.16, t);
  vec4 source = imageAt(uLogo, p, uLogoBox * uArtScale);
  if (t > 1.58) return source * settle;
  if (enter < 0.001) return vec4(0.0);
  float shape = 2.0 + 3.0 * ease(0.29, 0.36, t);
  // The sphere appears quickly, then the glass continues expanding after the
  // corners have squared off. Completing both motions at once feels abrupt.
  float expand = enter * (0.64 + 0.41 * (1.0 - exp(-max(t - 0.16, 0.0) * 5.8)));
  float collapse = 1.0 - ease(1.33, 1.52, t);
  float lensScale = max(0.001, mix(expand * mix(0.48, 1.0, collapse), 1.0, settle));
  float halfSize = uUnit * 0.5 * lensScale;
  float radius = superRadius(p / halfSize, shape);
  float sd = (radius - 1.0) * halfSize;
  float aa = max(fwidth(sd), 0.65);
  float mask = (1.0 - smoothstep(-aa, aa, sd));
  float glass = (1.0 - ease(1.05, 1.4, t)) * collapse * (1.0 - settle);
  float shown = ease(0.12, 0.165, t) * (1.0 - ease(1.39, 1.53, t));
  // Nothing is drawn beyond the thin echo just outside the rim.
  if (sd > uUnit * 0.10) return vec4(0.0);
  vec2 outward = superNormal(p / halfSize, shape);
  // A flat center rolls into a thick, curved shoulder. The normal continuously bends
  // source rays into the plate and folds them at its rim, whatever the source image.
  vec2 radial = normalize(p + vec2(0.001));
  float diagonal = max(0.0, 2.0 * radial.x * radial.y);
  float shoulderStart = 0.6 + 0.18 * ease(0.66, 1.15, t) * (1.0 - diagonal) + 0.16 * ease(1.0, 1.22, t) * diagonal;
  float shoulder = ease(shoulderStart, 1.0, radius);
  float slope = (0.04 * radius + (0.85 + 0.2 * (1.0 - ease(0.28, 0.75, t))) * shoulder * shoulder) * glass * uDropStrength;
  // The early sphere is rounder and more strongly magnifying than the settled tile.
  slope += (1.0 - ease(0.18, 0.42, t)) * radius * 0.32 * uDropStrength;
  vec2 opticalDirection = normalize(mix(outward, normalize(p + vec2(0.001)), 0.95));
  // A mild astigmatic shoulder carries the image into opposite corners.
  float astigmatism = 0.8 + 0.4 * radial.x * radial.y;
  vec2 n = opticalDirection * slope * astigmatism * (1.0 - settle);
  vec4 ink = refractedLogo(p, n, lensScale, glass, 1.0, sd);
  float illumination = 0.5 + 0.5 * dot(outward, normalize(vec2(-0.5, 0.9)));
  vec3 inkCoverage = refractedCoverage;
  // A dark plate deepens toward its rim; a pale frosted plate stays nearly even.
  float plateLight = ease(0.3, 0.8, dot(uTile, vec3(0.299, 0.587, 0.114)));
  vec3 body = uTile * (mix(0.55, 0.96, plateLight) + mix(0.45, 0.04, plateLight) * (1.0 - min(radius, 1.0)));
  body += vec3(0.004, 0.007, 0.01) * bell(radius - 0.75, 0.5);
  vec3 color = ink.rgb + body * (1.0 - inkCoverage) * glass * uTileEnabled;
  // On a pale page the plate's coverage follows the glass exactly, so its color
  // keeps the same hue while it melts into the page instead of dipping and
  // flaring. A dark page keeps its original fade.
  float plateFade = mix((1.0 - ease(1.08, 1.36, t)) * (1.0 - settle), glass, uPageLight);
  float alpha = max(ink.a, plateFade * uTileEnabled);
  // A broad studio light is reflected by the curved front face of the sphere.
  // It fades as the face flattens, revealing the dark glass beneath the artwork.
  vec2 spherePoint = p / halfSize;
  vec3 sphereNormal = normalize(vec3(spherePoint, sqrt(max(0.001, 1.0 - dot(spherePoint, spherePoint)))));
  vec3 sphereRay = reflect(vec3(0.0, 0.0, -1.0), sphereNormal);
  float lightTravel = mix(-0.12, 0.20, ease(0.13, 0.30, t));
  float softbox = bell(sphereRay.x - lightTravel, 1.05) * bell(sphereRay.y - 0.56, 0.52);
  float sphericalLight = softbox * (1.0 - ease(0.245, 0.36, t)) * glass * uHighlights * 0.70;
  color += vec3(0.50, 0.61, 0.72) * sphericalLight * (1.0 - ink.a * 0.85);
  alpha = max(alpha, sphericalLight);

  // Thin nested surface reflections, with asymmetric key light and a dim cool fill.
  // Material coordinates stay fixed during expansion and deterministic seeking.
  float arc = atan(p.y, p.x) * uUnit * 0.5;
  float grainScale = uUnit * 0.03;
  float developed = ease(0.23, 0.48, t);
  float cornerExposure = ease(0.12, 0.8, -2.0 * radial.x * radial.y);
  float reliefScale = lensScale * developed * (0.2 + 0.8 * cornerExposure);
  float sharedWarp = edgeWarp(arc, 0.0) * reliefScale;
  float rimSd = sd + sharedWarp;
  float innerSd = sd + sharedWarp * 0.7 + edgeWarp(arc, 41.0) * reliefScale * 0.4;
  float inner2Sd = sd + sharedWarp * 0.45 + edgeWarp(arc, 83.0) * reliefScale * 0.6;
  float thickness = 0.75 + 0.5 * contourNoise(arc / (uUnit * 0.013) + 13.0);
  // The bright rim line is a liquid edge, not an etched one. Its segments shimmer
  // in place and it bobs slightly across the edge as standing waves, so nothing
  // slides along it; its glints move as separate particles.
  float around = arc / (uUnit * 0.5);
  float rimBob = uUnit * 0.0025 * developed * (0.6 * sin(7.0 * around + 0.4) * sin(t * 6.3 + 1.0) + 0.4 * sin(3.0 * around + 2.0) * sin(t * 4.1));
  float rimLineSd = rimSd + rimBob;
  float shimmer = mix(contourNoise(arc / grainScale), contourNoise(arc / grainScale + 211.0), 0.5 + 0.5 * sin(t * 5.0 + 6.2832 * contourNoise(arc / (grainScale * 3.0) + 7.0)));
  float rim = bell(rimLineSd + uUnit * 0.002, uUnit * 0.0018 * thickness + aa * 0.3) * (0.6 + 0.8 * shimmer);
  // The nested lines nearer the center clear first; the outer rim lingers.
  float centerFade = 1.0 - ease(0.62, 0.92, t);
  float inner = centerFade * bell(innerSd + uUnit * 0.012, uUnit * 0.0025 / thickness + aa * 0.2) * (0.55 + 0.9 * contourNoise(arc / grainScale + 41.0));
  float inner2 = centerFade * bell(inner2Sd + uUnit * 0.022, uUnit * 0.0018 * thickness + aa * 0.1) * (0.5 + contourNoise(arc / grainScale + 83.0));
  float key = pow(illumination, 5.0);
  float rimVisibility = 1.0 - 0.55 * ease(0.75, 1.22, t);
  float lowerRight = pow(0.5 + 0.5 * dot(outward, normalize(vec2(0.8, -0.6))), 5.0);
  lowerRight *= ease(-0.25, -0.05, p.x / uUnit) * (1.0 - ease(-0.22, -0.02, p.y / uUnit));
  // Two separated walls, not two strokes at the same edge. The back wall is
  // inset by 7% of a tile edge, leaving a curved transmission channel between them.
  vec2 insetPoint = p - vec2(0.002, -0.002) * uUnit * lensScale;
  float wallGap = (0.055 - 0.023 * ease(0.18, 0.34, t)) + 0.050 * ease(0.14, 0.50, t) * (1.0 - 0.5 * ease(0.80, 1.22, t));
  float insetHalf = halfSize - wallGap * uUnit * lensScale;
  // The back face rounds off slightly later, giving the sphere and tile two visible
  // moving boundaries rather than scaling a second outline with the front face.
  float insetShape = max(2.0, 2.0 + (shape - 2.0) * ease(0.20, 0.55, t) - 0.45);
  float insetRadius = superRadius(insetPoint / insetHalf, insetShape);
  float insetSd = (insetRadius - 1.0) * insetHalf + sharedWarp * 0.4 + edgeWarp(arc, 151.0) * reliefScale * 0.7;
  float channel = ease(-uUnit * 0.008, uUnit * 0.025, insetSd) * mask;
  float echoMask = channel * lowerRight * glass * (1.0 - settle);
  vec3 backFace = vec3(0.0);
  float logoLight = 0.0;
  if (echoMask * uRelief > 0.002) {
    vec2 backNormal = normalize(mix(superNormal(insetPoint / insetHalf, insetShape), radial, 0.6));
    float backSlope = ease(0.90, 1.10, insetRadius) * 1.55 * glass * uDropStrength;
    // Sample a separate transmitted image across the whole bevel channel. Its
    // changing normal pulls a second, chromatically split copy of the logo into it.
    // A thick rim magnifies whatever lies closest behind it. Walk inward from the
    // wall until the ray meets ink and refract from there, so every logo lights
    // this corner from its own nearest shape; a logo with ink at the corner (like
    // X) is found on the first step and keeps its direct image.
    // The search starts where the wall already sends the ray, not at the wall.
    vec2 inward = -normalize(insetPoint + vec2(0.001));
    vec3 backRay = refract(vec3(0.0, 0.0, -1.0), normalize(vec3(backNormal * backSlope, 1.0)), 1.0 / 1.38);
    vec2 landing = insetPoint + backRay.xy / max(-backRay.z, 0.25) * uUnit * uDepth * 0.80 * lensScale;
    float reach = 0.0;
    for (int i = 0; i < 20; i++) {
      reach = float(i) * uUnit * lensScale * 0.03;
      if (imageAt(uLogo, landing + inward * reach, uLogoBox * uArtScale).a > 0.2) break;
    }
    vec4 backImage = refractedLogo(insetPoint + inward * reach, backNormal * backSlope, lensScale, glass, 1.6, sd);
    backFace = backImage.rgb * vec3(0.03, 0.65, 1.0) * echoMask * 0.48 * uRelief * (1.0 - 0.70 * ease(0.75, 1.12, t));
    // The lower-right light is this same refracted image, not a fixed lamp: it
    // only lights where the back wall bends logo ink into the bevel, and takes
    // that ink's shape as the logo or the refraction changes.
    logoLight = ease(0.05, 0.6, backImage.a);
  }
  lowerRight *= logoLight;
  float wallRim = centerFade * bell(insetSd, uUnit * 0.0028 + aa * 0.25);
  float wallShadow = centerFade * bell(insetSd + uUnit * 0.008, uUnit * 0.005);
  vec2 pores = vec2(0.0);
  if (developed * cornerExposure > 0.001) {
    pores = glassPores(arc, (rimSd + uUnit * 0.003) / lensScale, 313.0);
    pores += glassPores(arc, insetSd / lensScale, 617.0) * 0.6 * centerFade;
    pores += glassPores(arc, (inner2Sd + uUnit * 0.027) / lensScale, 919.0) * 0.8 * centerFade;
    pores *= developed * cornerExposure;
  }
  float angle = atan(p.y, p.x);
  float upperSliver = 0.12 + 1.15 * bell(angle - 2.18, 0.32);
  float lowerSliver = 0.12 + 1.10 * bell(angle + 0.85, 0.30);
  // The inner wall holds a brighter line around the upper-left and lower-right
  // corners, whatever the key light does. Each arc runs farther along the top or
  // bottom edge than down the side: its window is wider toward the horizontal.
  float tlOffset = angle - 0.75 * PI;
  float brOffset = angle + 0.25 * PI;
  float tlReach = tlOffset < 0.0 ? 0.65 : 0.42;
  float brReach = brOffset < 0.0 ? 0.65 : 0.42;
  float wallCorner = max(
    1.0 - ease(0.6 * tlReach, tlReach, abs(tlOffset)),
    1.0 - ease(0.6 * brReach, brReach, abs(brOffset))
  );
  vec3 insetLight = vec3(0.60, 0.78, 0.91) * wallRim * (key * key * 0.8 * upperSliver + lowerRight * lowerRight * 0.75 * lowerSliver + 0.005 + 0.35 * wallCorner * uInnerWallFocus);
  // The caustic follows the curved channel: a white-cyan core with blue lips, streaked
  // by the glass it passes through.
  // Filaments run parallel to the edge; their brightness drifts slowly along it.
  float drift = 0.7 + 0.6 * contourNoise(arc / (uUnit * 0.09) + 7.0);
  float filaments = (bell(innerSd + uUnit * 0.021, uUnit * 0.0035 * thickness) * 0.9 + bell(inner2Sd + uUnit * 0.028, uUnit * 0.004 / thickness) * 0.7) * centerFade + bell(rimSd + uUnit * 0.035, uUnit * 0.003 * thickness) * 0.5;
  vec3 lowerRelief = (
    vec3(0.03, 0.32, 1.0) * bell(sd + uUnit * 0.038, uUnit * 0.022 + aa * 0.2) * 0.55 +
    vec3(0.22, 0.62, 1.0) * bell(sd + uUnit * 0.027, uUnit * 0.012 + aa * 0.1) * 0.7 +
    vec3(0.75, 0.97, 1.0) * filaments * 1.35
  ) * drift * lowerRight * glass * uHighlights * uRelief * (1.0 - 0.85 * ease(0.6, 1.0, t)) * (1.0 - settle);
  lowerRelief *= 1.0 - pores.x * 0.22;
  lowerRelief += vec3(0.45, 0.85, 1.0) * pores.y * 0.10 * lowerRight * glass * uHighlights * uRelief * (1.0 - settle);
  // With focus at 0 the inner wall is drawn whole. Raising it keeps the wall on a
  // pale plate to its strongly lit segments and its upper-left and lower-right
  // arcs, since there its weak light clips to white and its shadow would
  // otherwise outline the full contour.
  float wallLit = clamp(key * key * 0.8 * upperSliver + lowerRight * lowerRight * 0.75 * lowerSliver, 0.0, 1.0);
  float wallGate = mix(1.0, max(ease(0.2, 0.7, wallLit), wallCorner), uPageLight * uInnerWallFocus);
  color *= 1.0 - wallShadow * wallGate * uRelief * 0.12 * (1.0 - ink.a);
  color += backFace + lowerRelief + insetLight * wallGate * glass * uHighlights * uRelief * (1.0 - ink.a) * mix(rimVisibility, 0.9, key);
  alpha = max(alpha, max(lowerRelief.r, max(lowerRelief.g, lowerRelief.b)));
  float rimLight = rim * (0.07 + key * 0.55) + inner * (0.025 + key * 0.16) + inner2 * 0.025;
  // Micro-bubbles along the lit edges, strongest where the key and the lower fill land.
  float speckSize = max(uUnit * 0.0042, 0.8 / uDpr);
  float bubbles = driftingSpecks(arc, rimLineSd + uUnit * 0.002, speckSize, 0.0, t) * 0.9;
  bubbles += specks(arc, innerSd + uUnit * 0.012, speckSize * 0.8, 97.0) * 0.6 * centerFade;
  bubbles += specks(arc, insetSd, speckSize * 0.9, 191.0) * 0.5 * centerFade;
  rimLight += bubbles * (0.04 + key * 0.5 + lowerRight * 0.45);
  rimLight = rimLight * (1.0 - pores.x * 0.35) + pores.y * (key * 0.16 + lowerRight * 0.12);
  vec3 spectralRim = vec3(0.0);
  vec3 spectralWeights = vec3(0.0);
  for (int i = 0; i < BANDS; i++) {
    float s = float(i) / float(BANDS - 1);
    vec3 w = spectrum(s);
    spectralRim += w * bell(rimSd + (s - 0.5) * uUnit * 0.011 * uDispersion + uUnit * 0.003, uUnit * 0.002 * thickness);
    spectralWeights += w;
  }
  spectralRim /= spectralWeights;
  vec3 reflection = (vec3(0.6, 0.76, 0.9) * rimLight * 1.15 + spectralRim * (0.02 + ink.a * 0.32)) * uHighlights * glass * mix(rimVisibility, 1.2, key);
  float sphericalRim = (
    bell(sd + uUnit * lensScale * 0.008, uUnit * lensScale * 0.009) * 0.60 +
    bell(insetSd, uUnit * lensScale * 0.008) * 0.40
  ) * (0.25 + 0.75 * abs(outward.y)) * (1.0 - ease(0.235, 0.34, t));
  reflection += vec3(0.65, 0.80, 0.90) * sphericalRim * 1.4 * uHighlights * glass;
  float cyanKey = pow(max(0.0, -outward.x), 8.0) * (1.0 - ease(0.235, 0.34, t));
  float cyanLip = bell(sd + uUnit * lensScale * 0.020, uUnit * lensScale * 0.009);
  cyanLip += bell(insetSd, uUnit * lensScale * 0.005) * 0.35;
  reflection += vec3(0.015, 0.68, 1.0) * cyanLip * cyanKey * glass * uHighlights * 0.85;
  // The young drop is full of scattered light: a milky glow behind the artwork.
  float youth = 1.0 - ease(0.25, 0.37, t);
  reflection += vec3(0.78, 0.84, 0.9) * youth * 0.07 * (0.5 + 0.5 * radius) * (1.0 - ink.a) * glass;
  vec3 film = mix(vec3(0.32, 0.0, 0.20), vec3(0.32, 0.08, 0.02), ease(0.75, 1.12, t)) * bell(sd + uUnit * 0.001, uUnit * 0.002) * ink.a * glass * uHighlights;
  color += reflection + film;
  alpha = max(alpha, max(reflection.r, max(reflection.g, reflection.b)));
  vec4 result = vec4(color * mask, alpha * mask);

  // Reflections outside the body are faint glass echoes, not solid colored outlines.
  float outer = bell(rimSd - uUnit * 0.012, uUnit * 0.0028 * thickness) * (0.04 + key * 0.2) * (0.5 + contourNoise(arc / grainScale + 131.0));
  outer += specks(arc, rimSd - uUnit * 0.012, speckSize, 277.0) * (0.03 + key * 0.3 + lowerRight * 0.25);
  // A single wave leaves the rim as the plate forms, stays close to it and fades.
  float waveAge = ease(0.36, 1.1, t);
  float wave = bell(sd - uUnit * (0.014 + 0.03 * waveAge), uUnit * 0.004 + aa * 0.3) * 0.05 * ease(0.34, 0.42, t) * (1.0 - waveAge);
  // The echo is lit through the plate, so it can carry the plate's hue and, on a
  // dark page, stay quieter than the rim it echoes.
  vec3 echoTint = mix(vec3(0.43, 0.62, 0.79), uTile + (1.0 - uTile) * 0.4, 0.5 * uEchoTint);
  float echoLevel = mix(1.0, mix(0.6, 1.0, uPageLight), uEchoTint);
  // The echo line runs around all four sides. The wave stays faint on the left
  // and right, where a full ring would read as streaks beside the glass.
  float waveSides = mix(1.0, 0.10, ease(0.25, 0.80, abs(outward.x)));
  vec3 ghost = (echoTint + ink.rgb * 0.6) * (outer + wave * waveSides) * glass * uHighlights * rimVisibility * echoLevel;
  float exterior = max(ghost.r, max(ghost.g, ghost.b)) * 1.8;
  result.rgb += exteriorColor(ghost * 1.8, exterior);
  result.a = max(result.a, exterior);
  // Resolve directly to the source, retaining its full size after the glass fades.
  return mix(result * shown, source, settle);
}

// The second drop is a radial lens with spherical aberration. Its core magnifies the
// wordmark (inverting it while the drop is tall), so between center and edge the image
// runs through focus and floods the drop; across its rim a thin ring of the image is
// stretched outward, and ripples crossing the rim repeat that ring in bands.
vec4 wordmarkLens(vec2 p) {
  float t = uTime;
  if (uWordmarkEnabled < 0.5) return vec4(0.0);
  if (t < 1.46) return vec4(0.0);
  if (t >= 3.3) return imageAt(uText, p, uTextBox);
  float radius = max(uDrop.x, 1.0);
  float r = length(p);
  if (r > radius + uUnit * 0.6) return vec4(0.0);
  vec2 outward = p / max(r, 0.001);
  float q = r / radius;
  float aa = 1.0 / uDpr;
  float edge = radius - r;
  float mask = ease(-aa, aa, edge);
  float young = 1.0 - ease(1.72, 2.02, t);

  float core = min(uDrop.y, radius);
  float coreQ = r / max(core, 1.0);
  float edgeLanding = core / max(uDropLens.x, 0.01);
  float center = uDrop.w;
  float landing = r < core
    ? edgeLanding * coreQ * (center + (1.0 - center) * pow(coreQ, uDropLens.y))
    : edgeLanding + (r - core) * uDrop.z;
  float rimZone = ease(core * 0.9, core, r);
  float k = 2.0 * PI / max(uDropLens.w, 1.0);
  landing += uDropLens.z * sin(k * r - uDropWave.x) * ease(0.0, uDropLens.w, r) * mix(uDropWave.y, 1.0, rimZone);
  vec2 bend = outward * (landing - r);
  float spread = uDropWave.z * uDispersion * (0.15 + 0.85 * rimZone);

  vec3 color = vec3(0.0);
  vec3 weights = vec3(0.0);
  float alpha = 0.0;
  float opacity = ease(1.46, 1.49, t);
  for (int i = 0; i < BANDS; i++) {
    float s = float(i) / float(BANDS - 1);
    vec2 source = p + bend * (1.0 + spread * (s - 0.5));
    vec4 ink = imageAt(uText, source, uTextBox);
    vec3 w = spectrum(s);
    color += ink.rgb * w;
    alpha += ink.a * (w.r + w.g + w.b);
    weights += w;
  }
  color /= weights;
  alpha /= weights.r + weights.g + weights.b;
  color *= 1.0 + uCaustics * bell(edge, uUnit * 0.06) * 0.15;
  color *= mask;
  alpha *= mask;
  // A fresh drop is full of scattered light: overexposed ink, a milky body and a cool
  // spill around it, all fading as it flattens.
  float fresh = 1.0 - ease(1.62, 1.95, t);
  color = min(color * (1.0 + 0.6 * fresh), vec3(1.0));
  float milk = mask * fresh * 0.30 * (0.6 + 0.4 * q) * uCaustics;
  color += vec3(0.75, 0.82, 0.9) * milk * (1.0 - alpha);
  float spill = exp(-max(r - radius, 0.0) / (uUnit * 0.17)) * (1.0 - mask) * fresh * 0.12;
  // As it spreads, the drop keeps a faint blue haze that dies with the waves.
  spill += exp(-max(r - radius, 0.0) / (uUnit * 0.4)) * (1.0 - fresh) * 0.035 * exp(-max(t - 1.95, 0.0) / 0.45) * (1.0 - ease(2.8, 3.1, t));
  color += vec3(0.32, 0.6, 1.0) * spill;
  alpha = max(alpha, max(milk, spill));
  vec3 sphereNormal = normalize(vec3(p / radius, sqrt(max(0.005, 1.0 - q * q))));
  vec3 reflected = reflect(vec3(0.0, 0.0, -1.0), sphereNormal);
  float softbox = bell(reflected.x + 0.3, 0.2) * bell(reflected.y - 0.55, 0.15);
  float smallLight = bell(reflected.x - 0.25, 0.14) * bell(reflected.y - 0.65, 0.08);
  float broadLight = bell(reflected.x + 0.35, 0.65) * bell(reflected.y - 0.6, 0.45);
  float surface = (softbox * 0.8 + smallLight * 0.6 + broadLight * 0.22) * young * uHighlights * mask;
  color += vec3(0.85, 0.95, 1.0) * surface;
  alpha = max(alpha, surface);

  float key = pow(0.5 + 0.5 * dot(outward, normalize(vec2(-0.6, 0.8))), 7.0);
  float rings = 0.0;
  for (int i = 0; i < 4; i++) {
    float j = float(i);
    float ringRadius = radius + (j - 1.0) * uUnit * 0.022 * (1.0 + 0.55 * ease(1.8, 3.1, t));
    rings += bell(r - ringRadius, uUnit * (0.003 + j * 0.001)) * (0.11 / (1.0 + j));
  }
  float age = max(0.0, t - 1.46);
  float fade = exp(-age / max(uDecay, 0.1)) * (1.0 - ease(2.65, 3.3, t));
  // Only the drop's own nested rims are lit; no broad glow or crest travels out
  // beyond it.
  float sideLight = pow(abs(outward.x), 10.0) * mix(1.0, 0.72, step(0.0, p.x));
  vec3 reflection = vec3(0.4, 0.62, 0.79) * rings * (0.3 + key * 2.0 + sideLight * 1.8) * fade * uHighlights;
  color += reflection;
  alpha = max(alpha, max(reflection.r, max(reflection.g, reflection.b)));
  return vec4(color, alpha) * opacity;
}

void main() {
  vec2 p = (gl_FragCoord.xy - uResolution * 0.5) / uDpr;
  vec4 icon = iconLens(p);
  vec4 wordmark = wordmarkLens(p);
  vec4 result = wordmark + icon * (1.0 - wordmark.a);
  // RGB and alpha use the same coverage; preserve saturated spectral fringes when
  // compositing onto transparent or colored backgrounds.
  result.a = clamp(max(result.a, max(result.r, max(result.g, result.b))), 0.0, 1.0);
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  outColor = vec4(clamp(result.rgb + dither * result.a, vec3(0.0), vec3(result.a)), result.a);
}
`,f=`#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uDpr;
uniform float uUnit;
uniform float uSettle;
uniform float uBloom;
uniform float uTime;
uniform float uFinish;
uniform float uPageLight;
out vec4 outColor;

// Filter premultiplied color and coverage together. The footprint is in CSS
// pixels, so the glass has the same optical softness on normal and retina screens.
vec4 softenedWaves(vec2 uv, float lod) {
  vec2 d = vec2(uDpr * 0.90) / uResolution;
  vec4 blurred = textureLod(uScene, uv, lod) * 0.25;
  blurred += textureLod(uScene, uv + vec2(d.x, 0.0), lod) * 0.125;
  blurred += textureLod(uScene, uv - vec2(d.x, 0.0), lod) * 0.125;
  blurred += textureLod(uScene, uv + vec2(0.0, d.y), lod) * 0.125;
  blurred += textureLod(uScene, uv - vec2(0.0, d.y), lod) * 0.125;
  blurred += textureLod(uScene, uv + d, lod) * 0.0625;
  blurred += textureLod(uScene, uv - d, lod) * 0.0625;
  blurred += textureLod(uScene, uv + vec2(d.x, -d.y), lod) * 0.0625;
  blurred += textureLod(uScene, uv + vec2(-d.x, d.y), lod) * 0.0625;
  return blurred;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 base = textureLod(uScene, uv, 0.0);
  float offset = log2(max(uDpr, 0.5));
  // Only the exterior liquid is softened. The artwork and its final resting
  // silhouette retain their native sharpness and original coverage.
  float wavePhase = smoothstep(0.29, 0.41, uTime) * (1.0 - smoothstep(1.25, 1.50, uTime));
  float waveMask = 0.0;
  if (wavePhase > 0.001) {
    float enter = smoothstep(0.025, 0.16, uTime);
    float expand = enter * (0.64 + 0.41 * (1.0 - exp(-max(uTime - 0.16, 0.0) * 5.8)));
    float collapse = 1.0 - smoothstep(1.33, 1.52, uTime);
    float lensScale = mix(expand * mix(0.48, 1.0, collapse), 1.0, smoothstep(0.0, 1.0, uSettle));
    float halfSize = max(0.001, uUnit * lensScale * 0.5);
    float shape = 2.0 + 3.0 * smoothstep(0.29, 0.36, uTime);
    vec2 p = abs((gl_FragCoord.xy - uResolution * 0.5) / uDpr) / halfSize;
    float radius = pow(pow(p.x, shape) + pow(p.y, shape), 1.0 / shape);
    float distance = (radius - 1.0) * halfSize;
    waveMask = smoothstep(0.0, max(0.75, uUnit * 0.004), distance) * wavePhase;
    if (waveMask > 0.001) {
      base = mix(base, softenedWaves(uv, max(0.0, offset + 0.15)), waveMask * 0.94);
    }
  }
  vec3 diffused = textureLod(uScene, uv, offset + 2.5).rgb * 0.50;
  diffused += textureLod(uScene, uv, offset + 4.1).rgb * 0.32;
  diffused += textureLod(uScene, uv, offset + 5.4).rgb * 0.18;
  float light = max(base.r, max(base.g, base.b));
  // Bright ink retains its calibrated color; light diffuses into its surroundings.
  float effect = 1.0 - smoothstep(0.0, 1.0, uFinish);
  // Bloom is light spilling onto a dark page. A pale page already holds that
  // light, and adding it where the plate thins out reads as a flash.
  vec3 glow = diffused * uBloom * 0.20 * (1.0 - min(1.0, light * 1.2)) * effect * (1.0 - uPageLight);
  float alpha = clamp(max(base.a, max(glow.r, max(glow.g, glow.b))), 0.0, 1.0);
  float grain = fract(sin(dot(gl_FragCoord.xy + floor(uTime * 24.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  vec3 color = base.rgb + glow + grain * 0.009 * base.a * clamp(light * 3.0 + 0.05, 0.05, 1.0) * effect * (1.0 - waveMask * 0.85);
  outColor = vec4(clamp(color, vec3(0.0), vec3(alpha)), alpha);
}
`,g={logo:`data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 104"><path fill="#fff" d="M35 24c0-2.6 1.7-4.8 4.2-5.5L79.6 7.6C82.6 6.8 85 9 85 12.1V64c0 8.9-7.3 17-16.5 19.2C59.3 85.4 52 81 52 73.2c0-9 7.5-16.9 16.7-19.1 3.3-.8 6.3-.9 8.3-.2V28.8L43 38.1V77c0 8.9-7.3 17-16.5 19.2C17.3 98.4 10 94 10 86.2c0-9 7.5-16.9 16.7-19.1 3.3-.8 6.3-.9 8.3-.2V24Z"/></svg>')}`,mark:`data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>')}`,text:"music",ending:"logo",logoSize:256,logoScale:.72,finalLogoScale:1,tile:!0,fontSize:64,fontFamily:'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',fontWeight:850,fontStretch:"expanded",letterSpacing:-.01,markGap:.12,theme:"dark",logoColor:"#ffffff",logoRelief:1,textColor:"#e2e6ee",tileColor:"#060c18",background:"#000000",depth:1.2,dispersion:1,relief:1,caustics:1,highlights:1,bloom:.55,dropSize:.32,dropStrength:1,echoTint:.5,innerWallFocus:0,decay:1.4,speed:1,loop:!1,loopDelay:1.6,paused:!1,maxDpr:2};function h(a,b){if(b<=a[0][0])return a[0][1];let c=a[a.length-1];if(b>=c[0])return c[1];let d=0;for(;b>a[d+1][0];)d++;let[e,f]=a[d],[g,h]=a[d+1],[i,j]=a[d-1]??[e-(g-e),f],[k,l]=a[d+2]??[g+(g-e),h],m=g-e,n=(b-e)/m,o=n*n,p=o*n;return(2*p-3*o+1)*f+(h-j)/(g-i)*m*(p-2*o+n)+(-2*p+3*o)*h+(l-f)/(k-e)*m*(p-o)}let i=[[.12,1.4],[.33,1.45],[.46,1.44],[.63,1.33],[.79,1.24],[.96,1.2],[1.13,1.11],[1.25,1],[1.335,.865],[1.376,.81],[1.418,.735],[1.46,.41]],j=[[1.46,.32],[1.55,.36],[1.67,.49],[1.75,.52],[1.84,.56],[1.92,.68],[2,.88],[2.15,.95],[2.4,1.06],[2.95,1.3]],k=[[1.46,1.5],[1.84,1.5],[1.92,.55],[2,.6],[2.09,.68],[2.17,.78],[2.3,.85],[2.5,.9],[2.75,.93],[2.95,.97],[3.02,1.03]],l=[[1.46,.3],[1.84,.3],[2,.25],[2.1,.2],[2.2,.2],[2.4,.25],[2.7,.3],[2.85,.45],[2.95,.8],[3.02,1]],m=[[1.46,-.6],[1.6,-.5],[1.75,-.3],[1.8,.4],[1.84,1]],n=[[1.46,1.5],[1.6,1.5],[1.75,2.2],[1.84,1.4],[1.92,1.2],[2,1.05],[2.1,1]],o=(a,b,c)=>{let d=Math.min(1,Math.max(0,(c-a)/(b-a)));return d*d*(3-2*d)},p={dark:{logoColor:"#ffffff",textColor:"#e2e6ee",tileColor:"#060c18",background:"#000000"},light:{logoColor:"#09111b",textColor:"#09111b",tileColor:"#e4e6ea",background:"#e2e2e5"}};function q(a){return new Promise(b=>{if(!a)return b(null);let c=new Image;c.crossOrigin="anonymous",c.decoding="async",c.onload=()=>b(c),c.onerror=()=>b(null),c.src=a})}let r=a=>2**Math.ceil(Math.log2(Math.max(2,a)));function s(a,b,c,d,e,f,g){if("original"===g)return void a.drawImage(b,c,d,e,f);let h=document.createElement("canvas");h.width=Math.max(1,Math.ceil(e)),h.height=Math.max(1,Math.ceil(f));let i=h.getContext("2d");i.drawImage(b,0,0,h.width,h.height),i.globalCompositeOperation="source-in",i.fillStyle=g,i.fillRect(0,0,h.width,h.height),a.drawImage(h,c,d,e,f)}function t(a){return{width:a.naturalWidth||a.width||1,height:a.naturalHeight||a.height||1}}function u(a,b,c){if(c<=0)return;let d=a.getContext("2d"),{width:e,height:f}=a,g=d.getImageData(0,0,e,f),h=g.data,i=new Float32Array(e*f);for(let a=0;a<i.length;a++)i[a]=1e6*(h[4*a+3]>127);let j=Math.SQRT2;for(let a=1;a<f-1;a++)for(let b=1;b<e-1;b++){let c=a*e+b;i[c]=Math.min(i[c],i[c-1]+1,i[c-e]+1,i[c-e-1]+j,i[c-e+1]+j)}for(let a=f-2;a>0;a--)for(let b=e-2;b>0;b--){let c=a*e+b;i[c]=Math.min(i[c],i[c+1]+1,i[c+e]+1,i[c+e-1]+j,i[c+e+1]+j)}for(let a=0;a<i.length;a++){let c=Math.max(0,1-i[a]/b);i[a]=Math.sqrt(Math.max(0,1-c*c))*b*.4}for(let a=1;a<f-1;a++)for(let b=1;b<e-1;b++){let d=a*e+b;if(!h[4*d+3])continue;let f=(i[d-1]-i[d+1])*.5,g=(i[d-e]-i[d+e])*.5,j=1+((.74+.26*Math.max(0,(-(.45*f)-.6*g+.8)/Math.hypot(f,g,1)))/(.74+.8*.26)-1)*c;for(let a=0;a<3;a++)h[4*d+a]*=j}d.putImageData(g,0,0)}function v(a){return`${a.fontWeight} ${a.fontSize}px ${a.fontFamily}`}function w(a){let b=document.createElement("canvas").getContext("2d");b.fillStyle="#000",b.fillStyle=a;let c=String(b.fillStyle);if(c.startsWith("#")){let a=parseInt(c.slice(1,7),16);return[(a>>16)/255,(a>>8&255)/255,(255&a)/255]}let d=c.match(/[\d.]+/g)?.map(Number)??[0,0,0];return[d[0]/255,d[1]/255,d[2]/255]}let x=(0,c.forwardRef)(function({height:a,backgroundImage:x,backgroundX:y=0,backgroundY:z=0,backgroundScale:A=1,backgroundTint:B="#000000",backgroundTintOpacity:C=0,className:D="",style:E,"aria-label":F,...G},H){var I;let J,K=(0,c.useRef)(null),L=(0,c.useRef)(null),[M,N]=(0,c.useState)(!1),[O,P]=(0,c.useState)(!1),Q=p["light"===G.theme?"light":"dark"],R=(I={...g,...Q,...G,...x?{tile:!1}:{},logo:G.logo??"/logo.svg"},J=(a,b,c,d)=>Number.isFinite(a)?Math.min(d,Math.max(c,a)):b,{...I,ending:"wordmark"===I.ending?"wordmark":"logo",theme:"light"===I.theme?"light":"dark",logoSize:J(I.logoSize,g.logoSize,24,1024),logoScale:J(I.logoScale,g.logoScale,.1,1),finalLogoScale:J(I.finalLogoScale,g.finalLogoScale,.1,1),fontSize:J(I.fontSize,g.fontSize,8,400),fontWeight:J(I.fontWeight,g.fontWeight,100,1e3),letterSpacing:J(I.letterSpacing,g.letterSpacing,-.3,1),markGap:J(I.markGap,g.markGap,0,2),depth:J(I.depth,g.depth,0,6),dispersion:J(I.dispersion,g.dispersion,0,4),relief:J(I.relief,g.relief,0,3),caustics:J(I.caustics,g.caustics,0,4),highlights:J(I.highlights,g.highlights,0,4),bloom:J(I.bloom,g.bloom,0,2),dropSize:J(I.dropSize,g.dropSize,.05,1.5),dropStrength:J(I.dropStrength,g.dropStrength,0,4),echoTint:J(I.echoTint,g.echoTint,0,1),logoRelief:J(I.logoRelief,g.logoRelief,0,1),innerWallFocus:J(I.innerWallFocus,g.innerWallFocus,0,1),decay:J(I.decay,g.decay,.1,10),speed:J(I.speed,g.speed,.1,4),loopDelay:J(I.loopDelay,g.loopDelay,0,30),maxDpr:J(I.maxDpr,g.maxDpr,.5,4)}),S=JSON.stringify(R),T=(0,c.useRef)(R);T.current=R,(0,c.useImperativeHandle)(H,()=>({replay:()=>L.current?.replay(),seek:a=>L.current?.seek(a),pause:()=>L.current?.pause(),play:()=>L.current?.play(),logo:R.logo}),[]),(0,c.useEffect)(()=>{if(!K.current)return;let a=null;try{a=function(a,b,c){let g=a.getContext("webgl2",{premultipliedAlpha:!0,alpha:!0,antialias:!1});if(!g)return null;let p=(a,b)=>{let c=g.createShader(a);if(g.shaderSource(c,b),g.compileShader(c),!g.getShaderParameter(c,g.COMPILE_STATUS)){let a=g.getShaderInfoLog(c);throw g.deleteShader(c),Error(a??"Liquid Glass Logo shader failed to compile.")}return c},x=a=>{let b=g.createProgram(),c=p(g.VERTEX_SHADER,d),e=p(g.FRAGMENT_SHADER,a);if(g.attachShader(b,c),g.attachShader(b,e),g.bindAttribLocation(b,0,"aPosition"),g.linkProgram(b),g.deleteShader(c),g.deleteShader(e),!g.getProgramParameter(b,g.LINK_STATUS)){let a=g.getProgramInfoLog(b);throw g.deleteProgram(b),Error(a??"Liquid Glass Logo program failed to link.")}return b},y=x(e),z=x(f),A=Object.fromEntries(["uScene","uResolution","uDpr","uUnit","uSettle","uBloom","uTime","uFinish","uPageLight"].map(a=>[a,g.getUniformLocation(z,a)])),B=new Map,C=a=>(B.has(a)||B.set(a,g.getUniformLocation(y,a)),B.get(a)),D=g.createVertexArray();g.bindVertexArray(D);let E=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,E),g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),g.STATIC_DRAW),g.enableVertexAttribArray(0),g.vertexAttribPointer(0,2,g.FLOAT,!1,0,0);let F=()=>{let a=g.createTexture();return g.bindTexture(g.TEXTURE_2D,a),g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array(4)),g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR),g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR),g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE),g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE),a},G=F(),H=F(),I=F(),J=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,J),g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,I,0),g.bindFramebuffer(g.FRAMEBUFFER,null);let K=0,L=0,M=(a,b)=>{g.activeTexture(g.TEXTURE0),g.bindTexture(g.TEXTURE_2D,a),g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,!0),g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,b),g.generateMipmap(g.TEXTURE_2D)},N=b,O=1,P=1,Q=1,R=[1,1],S=0,T=!1,U=!1,V="",W=0,X=null,Y=0,Z=0,$=!b.paused,_=!0,aa=0,ab=window.matchMedia?.("(prefers-reduced-motion: reduce)"),ac=()=>{if(!T||U)return;let b=Math.min(1,P/Math.max(1.9*N.logoSize,"wordmark"===N.ending?1.22*S:0),Q/(1.5*N.logoSize));(K!==a.width||L!==a.height)&&(K=a.width,L=a.height,g.activeTexture(g.TEXTURE0),g.bindTexture(g.TEXTURE_2D,I),g.texImage2D(g.TEXTURE_2D,0,g.RGBA8,K,L,0,g.RGBA,g.UNSIGNED_BYTE,null)),g.bindFramebuffer(g.FRAMEBUFFER,J),g.viewport(0,0,a.width,a.height),g.useProgram(y),g.bindVertexArray(D),[G,H].forEach((a,b)=>{g.activeTexture(g.TEXTURE0+b),g.bindTexture(g.TEXTURE_2D,a)}),g.uniform1i(C("uLogo"),0),g.uniform1i(C("uText"),1),g.uniform2f(C("uResolution"),a.width,a.height),g.uniform1f(C("uDpr"),a.width/P),g.uniform1f(C("uUnit"),N.logoSize*b),g.uniform2f(C("uLogoBox"),N.logoSize*b,N.logoSize*b),g.uniform2f(C("uTextBox"),R[0]*b,R[1]*b),g.uniform1f(C("uTextWidth"),S*b);let c="logo"===N.ending?1.8:3.3,d=ab?.matches?c:Y,e="logo"===N.ending?Math.min(1.8,d):d;g.uniform1f(C("uTime"),e),g.uniform1f(C("uWordmarkEnabled"),+("wordmark"===N.ending));let f="logo"===N.ending?Math.max(0,Math.min(1,(d-1.16)/.24)):0,p=N.logoSize*b,q=Math.max(S*b/2,.3*p),r=1-o(2.85,3.02,e);g.uniform4f(C("uDrop"),q*h(j,e),q*h(k,e),Math.max(.02,Math.min(1,h(l,e))),1+(h(m,e)-1)*N.dropStrength),g.uniform4f(C("uDropLens"),1+(h(n,e)-1)*N.dropStrength,2+4*o(1.74,1.84,e),p*(.009*Math.exp(-Math.max(e-1.46,0)/.5)*(1-o(1.85,1.95,e))+.012*o(2.2,2.4,e))*r,p*(.07+(.03-.07)*o(1.9,2.4,e))),g.uniform4f(C("uDropWave"),(e-1.45)*42,1-o(1.85,2,e),2*(.12+1.6*o(1.86,2,e)-.9*o(2.25,2.5,e))*r,0);let s=o(1.13,1.28,d),t="logo"===N.ending&&d>1.13?h(i,1.13)*(1-s)+N.finalLogoScale*s:h(i,e);g.uniform1f(C("uArtScale"),t),g.uniform1f(C("uSettle"),f),g.uniform3fv(C("uTile"),w(N.tileColor));let[u,v,x]=w(N.background),B=Math.min(1,Math.max(0,(.299*u+.587*v+.114*x-.35)/.4));g.uniform1f(C("uPageLight"),B),g.uniform1f(C("uTileEnabled"),+!!N.tile),g.uniform1f(C("uDepth"),N.depth),g.uniform1f(C("uDispersion"),N.dispersion),g.uniform1f(C("uRelief"),N.relief),g.uniform1f(C("uCaustics"),N.caustics),g.uniform1f(C("uHighlights"),N.highlights),g.uniform1f(C("uEchoTint"),N.echoTint),g.uniform1f(C("uInnerWallFocus"),N.innerWallFocus),g.uniform1f(C("uDropSize"),N.dropSize),g.uniform1f(C("uDropStrength"),N.dropStrength),g.uniform1f(C("uDecay"),N.decay),g.drawArrays(g.TRIANGLES,0,3),g.bindFramebuffer(g.FRAMEBUFFER,null),g.useProgram(z),g.activeTexture(g.TEXTURE0),g.bindTexture(g.TEXTURE_2D,I),g.generateMipmap(g.TEXTURE_2D),g.uniform1i(A.uScene,0),g.uniform2f(A.uResolution,a.width,a.height),g.uniform1f(A.uDpr,a.width/P),g.uniform1f(A.uUnit,p),g.uniform1f(A.uSettle,f),g.uniform1f(A.uBloom,N.bloom),g.uniform1f(A.uPageLight,B),g.uniform1f(A.uTime,e),g.uniform1f(A.uFinish,"logo"===N.ending?Math.max(0,Math.min(1,(d-1.05)/.75)):Math.max(0,Math.min(1,(d-2.8)/.5))),g.drawArrays(g.TRIANGLES,0,3)},ad=async()=>{let a=JSON.stringify([N.logo,N.mark,N.text,N.logoSize,N.logoScale,N.fontSize,N.fontFamily,N.fontWeight,N.fontStretch,N.letterSpacing,N.markGap,N.logoColor,N.logoRelief,N.textColor,O]);if(a===V)return;V=a;let b=++W,d={...N},e="logo"===d.mark?d.logo:d.mark,[f,g]=await Promise.all([q(d.logo),e===d.logo?null:q(e),document.fonts?.load(v(d),d.text||"x").catch(()=>void 0)]);if(U||b!==W)return;let h=e===d.logo?f:g,i=JSON.stringify([d.logo,d.logoSize,d.logoScale,d.logoColor,d.logoRelief,O]),j=X?.key===i?X.raster:function(a,b,c){let d=Math.min(2048,r(b.logoSize*c*2)),e=document.createElement("canvas");e.width=e.height=d;let f=e.getContext("2d");if(a){let{width:c,height:e}=t(a),g=d*b.logoScale/Math.max(c,e),h=c*g,i=e*g;s(f,a,(d-h)/2,(d-i)/2,h,i,b.logoColor)}return a&&"original"!==b.logoColor&&u(e,.03*e.width,b.logoRelief),{canvas:e,box:[b.logoSize,b.logoSize]}}(f,d,O);X={key:i,raster:j};let k=function(a,b,c){let d=document.createElement("canvas").getContext("2d");d.font=v(b),d.fontStretch=b.fontStretch;let e=b.letterSpacing*b.fontSize;d.letterSpacing=`${e}px`;let f=Math.max(0,d.measureText(b.text).width),g=d.measureText(b.text||"x"),h=g.actualBoundingBoxAscent||.72*b.fontSize,i=g.actualBoundingBoxDescent||.2*b.fontSize,j=d.measureText("x").actualBoundingBoxAscent||.52*b.fontSize,k=0,l=0;if(a){let{width:b,height:c}=t(a);k=b/c*(l=Math.max(h,1.3*j))}let m=a&&b.text.length?b.markGap*b.fontSize:0,n=k+m+f,o=.5*b.fontSize,p=[n+2*o,2*b.fontSize],q=Math.min(2*c,4096/p[0],4096/p[1]),w=document.createElement("canvas");w.width=Math.min(4096,r(p[0]*q)),w.height=Math.min(4096,r(p[1]*q));let x=w.getContext("2d");x.scale(w.width/p[0],w.height/p[1]);let y=p[1]/2+(h-i)/2,z=o;return a&&(s(x,a,z,y-l,k,l,"original"===b.logoColor?"original":b.textColor),z+=k+m),x.font=v(b),x.fontStretch=b.fontStretch,x.fillStyle=b.textColor,x.textBaseline="alphabetic",x.letterSpacing=`${e}px`,x.textAlign="left",x.fillText(b.text,z,y),"original"!==b.logoColor&&u(w,.04*b.fontSize*w.height/p[1],b.logoRelief),{canvas:w,box:p,contentWidth:n}}(e?h:null,d,O);M(G,j.canvas),M(H,k.canvas),R=k.box,S=k.contentWidth,T||(T=!0,Z=0,c?.()),ac(),af()},ae=a=>{aa=0;let b=Z?Math.min(.05,(a-Z)/1e3):0;Z=a;let c=$&&_&&!ab?.matches&&T;if(c){Y+=b*N.speed;let a=("logo"===N.ending?1.8:3.3)+N.loopDelay;N.loop&&Y>=a&&(Y%=a)}ac(),c&&(N.loop||Y<("logo"===N.ending?1.8:3.3))?af():Z=0};function af(){aa||U||(aa=requestAnimationFrame(ae))}let ag=()=>{let b=getComputedStyle(a);P=Math.max(1,Number.parseFloat(b.width)||a.clientWidth),Q=Math.max(1,Number.parseFloat(b.height)||a.clientHeight);let c=Math.min(window.devicePixelRatio||1,N.maxDpr);a.width=Math.max(1,Math.round(P*c)),a.height=Math.max(1,Math.round(Q*c)),c!==O&&(O=c,ad()),ac(),af()},ah=new ResizeObserver(ag);ah.observe(a);let ai=new IntersectionObserver(([a])=>{_=a?.isIntersecting??!0,Z=0,_&&af()});ai.observe(a);let aj=()=>{Z=0,af()};return ab?.addEventListener?.("change",aj),ag(),ad(),{update(a){let b=$;N=a,$=!a.paused,!b&&$&&(Z=0),ag(),ad()},replay(){Y=0,Z=0,ac(),af()},seek(a){Y=Number.isFinite(a)?Math.max(0,Math.min(3600,a)):0,Z=0,ac()},pause(){$=!1,Z=0},play(){$=!0,Z=0,af()},dispose(){U=!0,X=null,cancelAnimationFrame(aa),ah.disconnect(),ai.disconnect(),ab?.removeEventListener?.("change",aj),g.deleteTexture(G),g.deleteTexture(H),g.deleteTexture(I),g.deleteFramebuffer(J),g.deleteBuffer(E),g.deleteVertexArray(D),g.deleteProgram(y),g.deleteProgram(z)}}}(K.current,T.current,()=>N(!0))}catch{a=null}return a||P(!0),L.current=a,()=>{a?.dispose(),L.current=null}},[]),(0,c.useLayoutEffect)(()=>L.current?.update(T.current),[S]);let U="logo"===R.mark?R.logo:R.mark;return(0,b.jsxs)("div",{className:`liquid-glass-logo ${D}`.trim(),style:{height:a,background:R.background,...E},role:"img","aria-label":F??("logo"===R.ending?"Logo":R.text),"data-liquid-glass-ready":M||void 0,children:[x&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("div",{className:"liquid-glass-logo-background","aria-hidden":"true",style:{background:`url(${JSON.stringify(x)}) center / cover no-repeat`,transform:`translate(${Math.max(-100,Math.min(100,y))}%, ${Math.max(-100,Math.min(100,z))}%) scale(${Math.max(1,Math.min(3,A))})`}}),(0,b.jsx)("div",{className:"liquid-glass-logo-background","aria-hidden":"true",style:{backgroundColor:B,opacity:Math.max(0,Math.min(1,C))}})]}),(0,b.jsx)("canvas",{ref:K,"aria-hidden":"true"}),O&&(0,b.jsx)("span",{className:"liquid-glass-logo-fallback","aria-hidden":"true",style:{color:R.textColor,fontFamily:R.fontFamily,fontWeight:R.fontWeight,fontSize:R.fontSize,letterSpacing:`${R.letterSpacing}em`,gap:`${R.markGap}em`},children:"logo"===R.ending?(0,b.jsx)("img",{src:R.logo,alt:"",style:{width:R.logoSize*R.logoScale*R.finalLogoScale,height:R.logoSize*R.logoScale*R.finalLogoScale,maxWidth:"80%",maxHeight:"80%",objectFit:"contain"}}):(0,b.jsxs)(b.Fragment,{children:[U&&(0,b.jsx)("img",{src:U,alt:""}),R.text]})})]})});a.s(["default",0,()=>{let[a,d]=(0,c.useState)("playing"),e=(0,c.useRef)([]);return((0,c.useEffect)(()=>{document.documentElement.dataset.siteReady="false";let a=document.body.style.overflow;document.body.style.overflow="hidden";let b=window.setTimeout(()=>{d("fading"),e.current.push(window.setTimeout(()=>{d("done"),document.documentElement.dataset.siteReady="true",window.dispatchEvent(new Event("site:ready")),document.body.style.overflow=a},500))},2300);return e.current.push(b),()=>{e.current.forEach(a=>window.clearTimeout(a)),e.current=[],document.body.style.overflow=a}},[]),"done"===a)?null:(0,b.jsx)("div",{className:`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ease-out ${"fading"===a?"opacity-0":"opacity-100"}`,"aria-label":"Loading $COOKED","aria-busy":"playing"===a,children:(0,b.jsx)(x,{logo:"/logo.svg",ending:"logo",text:"$COOKED",logoColor:"original",style:{height:480}})})}],64224)},41613,a=>{var b=a.i(87924),c=a.i(72131);let d=["circle","triangle","square","cloud","teardrop","puff"],e=a=>d.includes(a),f={circle:[0,6],triangle:[1,7],square:[2],cloud:[5,8,2],teardrop:[4],puff:[3]},g=2*Math.PI;function h(a,b,c,d,e){return Array.from({length:e},(f,h)=>{let i=h/e*g;return[a+Math.cos(i)*d,b+Math.sin(i)*d,c]})}let i={circle:()=>({pieces:[{points:[[0,0,0]],radius:1}],face:{type:"curved",c:[0,0,0],r:[1,1,1],maxTurn:.75},eye:{halfWidth:.14,halfHeight:.28,spread:.24},areaScale:1}),triangle:()=>{var a;return{pieces:[{points:(a=1.14-.16,Array.from({length:40},(b,c)=>{let d=c/40*g;return[0+Math.cos(d)*a,.575,0+Math.sin(d)*a]})),balls:[[[0,-.575,0],.49]],radius:.16}],view:{pitch:-.315,yaw:0},face:{type:"curved",c:[0,.2,.15],r:[.78,.66,.66],maxTurn:.6},eye:{halfWidth:.12,halfHeight:.27,spread:.21},areaScale:1.05}},square:()=>{let a=[];for(let b of[-.88,.88])for(let c of[-.88,.88])for(let d of[-.88,.88])a.push([b,c,d]);return{pieces:[{points:a,radius:.12}],view:{pitch:-.32,yaw:-.5},face:{type:"flat",o:[0,0,1],u:[1,0,0],v:[0,1,0],maxU:.87-.3-.19,maxV:.39},eye:{halfWidth:.19,halfHeight:.48,spread:.3},areaScale:1.1}},cloud:()=>({pieces:[{points:[[-.228,-.376,-.12]],radius:.582},{points:[[.395,-.328,.12]],radius:.46},{points:[[-.627,.132,.1]],radius:.538},{points:[[.551,.239,-.08]],radius:.508},{points:[[-.057,.371,.12]],radius:.49},{points:[[0,0,0]],radius:.5,collide:!1}],face:{type:"curved",c:[0,.05,0],r:[.8,.62,.5],maxTurn:.55},eye:{halfWidth:.13,halfHeight:.29,spread:.22},areaScale:1.12}),teardrop:()=>({pieces:[{points:[[0,-.845,0]],balls:[[[0,.1,0],.992]],radius:.349}],face:{type:"curved",c:[0,.1,0],r:[.92,.92,.92],maxTurn:.7},eye:{halfWidth:.13,halfHeight:.26,spread:.24},areaScale:1}),puff:()=>{let a=(a,b,c,d=!0)=>({points:[...h(a,b,.45,c-.05,18),...h(a,b,-.45,c-.05,18)],radius:.05,collide:d});return{pieces:[...Array.from({length:6},(b,c)=>{let d=-Math.PI/2+c*g/6;return a(.57*Math.cos(d),.57*Math.sin(d),.42)}),a(0,0,.6,!1)],view:{pitch:.42,yaw:-.28},face:{type:"flat",o:[0,0,.5],u:[1,0,0],v:[0,1,0],maxU:.2,maxV:.2},eye:{halfWidth:.13,halfHeight:.32,spread:.26},areaScale:1.05}}};function j(a,b,c=new Float64Array(9)){let d=Math.cos(a),e=Math.sin(a),f=Math.cos(b),g=Math.sin(b);return c[0]=f,c[1]=0,c[2]=g,c[3]=e*g,c[4]=d,c[5]=-e*f,c[6]=-d*g,c[7]=e,c[8]=d*f,c}let k=new Float64Array(256),l=new Float64Array(256),m=new Int32Array(256),n=new Int32Array(512),o=Float64Array.from({length:28},(a,b)=>Math.cos(b/28*g)),p=Float64Array.from({length:28},(a,b)=>Math.sin(b/28*g));function q(a,b,c){let d=a.count;c.radius=a.radius;for(let c=0;c<d;c++){let d=a.x[c],e=a.y[c],f=a.z[c];k[c]=b?b[0]*d+b[1]*e+b[2]*f:d,l[c]=b?b[3]*d+b[4]*e+b[5]*f:e}for(let c=0;c<a.balls;c++){let e=a.bx[c],f=a.by[c],g=a.bz[c],h=b?b[0]*e+b[1]*f+b[2]*g:e,i=b?b[3]*e+b[4]*f+b[5]*g:f,j=a.br[c]-a.radius;for(let a=0;a<28;a++)k[d]=h+o[a]*j,l[d]=i+p[a]*j,d++}if(1===d){c.x[0]=k[0],c.y[0]=l[0],c.count=1,s(c);return}for(let a=0;a<d;a++)m[a]=a;let e=m.subarray(0,d);e.sort((a,b)=>k[a]-k[b]||l[a]-l[b]);let f=(a,b,c)=>(k[b]-k[a])*(l[c]-l[a])-(l[b]-l[a])*(k[c]-k[a]),g=0;for(let a=0;a<d;a++){let b=e[a];for(;g>=2&&1e-10>=f(n[g-2],n[g-1],b);)g--;n[g++]=b}let h=g+1;for(let a=d-2;a>=0;a--){let b=e[a];for(;g>=h&&1e-10>=f(n[g-2],n[g-1],b);)g--;n[g++]=b}g=Math.max(1,g-1);let i=0;for(let a=0;a<g;a++){let b=k[n[a]],d=l[n[a]];!(i&&1e-9>Math.abs(b-c.x[i-1])&&1e-9>Math.abs(d-c.y[i-1]))&&(c.x[i]=b,c.y[i]=d,i++)}c.count=i;let j=0;for(let a=0;a<i;a++){let b=a+1===i?0:a+1;j+=c.x[a]*c.y[b]-c.x[b]*c.y[a]}if(j<0)for(let a=0,b=i-1;a<b;a++,b--){let d=c.x[a],e=c.y[a];c.x[a]=c.x[b],c.y[a]=c.y[b],c.x[b]=d,c.y[b]=e}s(c)}function r(a){let b=Math.max(1,a.count+28*a.balls);return{x:new Float64Array(b),y:new Float64Array(b),nx:new Float64Array(b),ny:new Float64Array(b),count:0,radius:a.radius,cx:0,cy:0,bound:0}}function s(a){let{count:b,x:c,y:d}=a,e=0,f=0;for(let g=0;g<b;g++)if(e+=c[g],f+=d[g],b>1){let e=g+1===b?0:g+1,f=c[e]-c[g],h=d[e]-d[g],i=Math.hypot(f,h)||1;a.nx[g]=h/i,a.ny[g]=-f/i}e/=b,f/=b;let g=0;for(let a=0;a<b;a++)g=Math.max(g,Math.hypot(c[a]-e,d[a]-f));a.cx=e,a.cy=f,a.bound=g+a.radius}function t(a,b,c){let d=1/0;for(let e of a)d=Math.min(d,function(a,b,c){let{x:d,y:e,count:f,radius:g}=a;if(1===f)return Math.hypot(b-d[0],c-e[0])-g;let h=!0,i=1/0;for(let g=0;g<f;g++){let j=g+1===f?0:g+1,k=d[j]-d[g],l=e[j]-e[g],m=Math.max(0,Math.min(1,((b-d[g])*k+(c-e[g])*l)/(k*k+l*l)));i=Math.min(i,Math.hypot(b-d[g]-k*m,c-e[g]-l*m)),(b-d[g])*a.nx[g]+(c-e[g])*a.ny[g]>0&&(h=!1)}return(h?-i:i)-g}(e,b,c));return d}function u(a,b){return b?[b[0]*a[0]+b[1]*a[1]+b[2]*a[2],b[3]*a[0]+b[4]*a[1]+b[5]*a[2],b[6]*a[0]+b[7]*a[1]+b[8]*a[2]]:a}let v=new Map;function w(a){let b=v.get(a);return b||v.set(a,b=function(a){let b=i[a](),c=b.view?j(b.view.pitch,b.view.yaw):null,d=b.pieces.map(a=>{let b=a.points.map(a=>u(a,c)),d=(a.balls??[]).map(([a,b])=>[u(a,c),b]);return{x:Float64Array.from(b,a=>a[0]),y:Float64Array.from(b,a=>a[1]),z:Float64Array.from(b,a=>a[2]),count:b.length,bx:Float64Array.from(d,a=>a[0][0]),by:Float64Array.from(d,a=>a[0][1]),bz:Float64Array.from(d,a=>a[0][2]),br:Float64Array.from(d,a=>a[1]),balls:d.length,radius:a.radius,collide:!1!==a.collide}}),e="curved"===b.face.type?{...b.face,c:u(b.face.c,c)}:{...b.face,o:u(b.face.o,c),u:u(b.face.u,c),v:u(b.face.v,c)},f=()=>d.map(a=>{let b=r(a);return q(a,null,b),b}),g=a=>{let b=1/0,c=1/0,d=-1/0,e=-1/0;for(let f of a)b=Math.min(b,f.cx-f.bound),d=Math.max(d,f.cx+f.bound),c=Math.min(c,f.cy-f.bound),e=Math.max(e,f.cy+f.bound);let f=Math.max(d-b,e-c)/160,g=f*f,h=0,i=0,j=0,k=0;for(let l=c+f/2;l<e;l+=f)for(let c=b+f/2;c<d;c+=f)0>=t(a,c,l)&&(h+=g,i+=c*g,j+=l*g,k+=(c*c+l*l)*g);return{area:h,cx:i/h,cy:j/h,sxx:k}},h=g(f()),k=0,l=0;for(let a of d)for(let b=0;b<a.count;b++)k+=a.z[b],l++;let m=k/l,n=Math.sqrt(Math.PI*b.areaScale/h.area),o=a=>[(a[0]-h.cx)*n,(a[1]-h.cy)*n,(a[2]-m)*n];d=d.map(a=>{for(let b=0;b<a.count;b++)[a.x[b],a.y[b],a.z[b]]=o([a.x[b],a.y[b],a.z[b]]);for(let b=0;b<a.balls;b++)[a.bx[b],a.by[b],a.bz[b]]=o([a.bx[b],a.by[b],a.bz[b]]),a.br[b]*=n;return a.radius*=n,a}),e="curved"===e.type?{...e,c:o(e.c),r:[e.r[0]*n,e.r[1]*n,e.r[2]*n]}:{...e,o:o(e.o),u:[e.u[0]*n,e.u[1]*n,e.u[2]*n],v:[e.v[0]*n,e.v[1]*n,e.v[2]*n]};let p=f(),s=g(p),v=s.sxx-s.area*(s.cx*s.cx+s.cy*s.cy),w=0,x=0,y=0,z=0,A=0,B=0;for(let a of p)for(let b=0;b<a.count;b++)w=Math.max(w,Math.hypot(a.x[b],a.y[b])+a.radius),y=Math.min(y,a.x[b]-a.radius),z=Math.max(z,a.x[b]+a.radius),A=Math.min(A,a.y[b]-a.radius),B=Math.max(B,a.y[b]+a.radius);for(let a of d){for(let b=0;b<a.count;b++)x=Math.max(x,Math.hypot(a.x[b],a.y[b],a.z[b])+a.radius);for(let b=0;b<a.balls;b++)x=Math.max(x,Math.hypot(a.bx[b],a.by[b],a.bz[b])+a.br[b])}let C=d.flatMap((a,b)=>a.collide?[b]:[]);return{kind:a,pieces:d,colliderIndex:C,parts:p,colliders:C.map(a=>p[a]),area:Math.PI*b.areaScale,inertia:v,bound:w,bound3:x,left:y,right:z,top:A,bottom:B,face:e,eye:{...b.eye}}}(a)),b}function x(a,b,c,d=0,e=0){let{x:f,y:h,nx:i,ny:j,count:k}=b,l=b.radius*c;if(1===k){let b=f[0]*c+d,i=h[0]*c+e;a.moveTo(b+l,i),a.arc(b,i,l,0,g);return}if(2===k){let b=Math.atan2(j[1],i[1]),g=Math.atan2(j[0],i[0]);a.moveTo(f[0]*c+d+Math.cos(b)*l,h[0]*c+e+Math.sin(b)*l),a.arc(f[0]*c+d,h[0]*c+e,l,b,g),a.arc(f[1]*c+d,h[1]*c+e,l,g,b),a.closePath();return}let m=a=>f[a]*c+d,n=a=>h[a]*c+e,o=a=>(m(a)+m(a+1===k?0:a+1))/2+i[a]*l,p=a=>(n(a)+n(a+1===k?0:a+1))/2+j[a]*l;a.moveTo(o(0),p(0));for(let b=1;b<=k;b++){let c=b===k?0:b,d=b-1,e=i[d]*i[c]+j[d]*j[c],g=c+1===k?0:c+1,q=Math.hypot(f[c]-f[d],h[c]-h[d])<z&&Math.hypot(f[g]-f[c],h[g]-h[c])<z;if(e>y&&q){let b=l/(1+e);a.quadraticCurveTo(m(c)+(i[d]+i[c])*b,n(c)+(j[d]+j[c])*b,o(c),p(c))}else a.lineTo(m(c)+i[d]*l,n(c)+j[d]*l),a.arc(m(c),n(c),l,Math.atan2(j[d],i[d]),Math.atan2(j[c],i[c])),a.lineTo(o(c),p(c))}a.closePath()}let y=.9047516632199634,z=.3,A=new Map,B=3,C={variant:"solids",shape:"mixed",depth:"3d",faces:!0,faceColor:"#ffffff",followCursor:!0,cursorFollowRatio:.4,count:22,size:50,sizeVariation:.15,spawnRate:14,appearanceDuration:.55,gravity:1600,wind:0,restitution:.42,friction:.45,damping:0,spin:1,seed:52490,paused:!1,interactive:!0,colors:["#3c82f6","#eb4699","#f19c38","#ea4044","#8a5cf6","#54b9a7","#906a44","#ed712e","#5bc67a"],background:"var(--theme-background, Canvas)"},D=(a,b,c,d)=>Math.max(b,Math.min(c,Number.isFinite(a)?a:d));function E(a){return{...a,variant:"solids",shape:"mixed"===a.shape||d.includes(a.shape)?a.shape:"mixed",depth:"2d"===a.depth?"2d":"3d",followCursor:!1!==a.followCursor,cursorFollowRatio:D(a.cursorFollowRatio,0,1,C.cursorFollowRatio),count:Math.round(D(a.count,0,400,C.count)),size:D(a.size,8,80,C.size),sizeVariation:D(a.sizeVariation,0,.8,C.sizeVariation),spawnRate:D(a.spawnRate,.2,30,C.spawnRate),appearanceDuration:D(a.appearanceDuration,0,5,C.appearanceDuration),gravity:D(a.gravity,-4e3,4e3,C.gravity),wind:D(a.wind,-600,600,0),restitution:D(a.restitution,0,.95,C.restitution),friction:D(a.friction,0,1,C.friction),damping:D(a.damping,0,5,C.damping),spin:D(a.spin,0,4,C.spin),seed:Math.round(D(a.seed,0,1e5,C.seed)),colors:a.colors?.length?a.colors.slice(0,12):C.colors}}function F(a){let b=a>>>0;return()=>{let a=b+=0x6d2b79f5;return a=Math.imul(a^a>>>15,1|a),(((a^=a+Math.imul(a^a>>>7,61|a))^a>>>14)>>>0)/0x100000000}}let G=()=>({id:0,ax:0,ay:0,bx:0,by:0,separation:0,normalImpulse:0,tangentImpulse:0,maxNormalImpulse:0,normalMass:0,tangentMass:0,relativeVelocity:0}),H=()=>({key:0,a:null,b:null,nx:0,ny:0,count:0,points:[G(),G()],touching:!1,fresh:!0});function I(a,b){a.shape=b,a.paint=b.pieces.map(a=>{let b=r(a);return q(a,null,b),b}),a.local=b.colliderIndex.map(b=>a.paint[b]),a.parts=b.colliderIndex.map(a=>r(b.pieces[a])),a.turned=!1,a.pitch=a.yaw=0}function J(a){let b=Math.abs(a.pitch)+Math.abs(a.yaw)>.002;if(!b&&!a.turned)return;a.turned=b;let c=a.shape.pieces;if(b){j(a.pitch,a.yaw,a.rotation);for(let b=0;b<c.length;b++)q(c[b],a.rotation,a.paint[b])}else{a.pitch=a.yaw=0;for(let b=0;b<c.length;b++)q(c[b],null,a.paint[b])}}function K(a,b){a.radius=b;let c=b*Math.max(.05,a.growth),d=a.shape.area*c*c/1e3;a.inverseMass=1/d,a.inverseInertia=1/(a.shape.inertia*c**4/1e3)}function L(a,b=0){let c=a.radius*a.growth,d=Math.cos(a.angle),e=Math.sin(a.angle),f=1/0,g=1/0,h=-1/0,i=-1/0,j=a.local;for(let b=0;b<j.length;b++){let k=j[b],l=a.parts[b],m=k.radius*c;l.count=k.count;for(let b=0;b<k.count;b++){let j=k.x[b]*c,n=k.y[b]*c,o=a.x+j*d-n*e,p=a.y+j*e+n*d;l.x[b]=o,l.y[b]=p,l.nx[b]=k.nx[b]*d-k.ny[b]*e,l.ny[b]=k.nx[b]*e+k.ny[b]*d,o-m<f&&(f=o-m),o+m>h&&(h=o+m),p-m<g&&(g=p-m),p+m>i&&(i=p+m)}l.radius=m;let n=k.cx*c,o=k.cy*c;l.cx=a.x+n*d-o*e,l.cy=a.y+n*e+o*d,l.bound=k.bound*c}a.minX=f-b,a.minY=g-b,a.maxX=h+b,a.maxY=i+b}function M(a,b,c,d,e,f){let g=a.points[b];g.ax=c,g.ay=d,g.separation=e,g.id=f}function N(a,b,c,d,e){let f=b.x[0],g=b.y[0],h=a.radius+b.radius,i=-1/0,j=0;for(let b=0;b<a.count;b++){let c=a.nx[b]*(f-a.x[b])+a.ny[b]*(g-a.y[b]);c>i&&(i=c,j=b)}if(i-h>c)return 0;let k=j+1===a.count?0:j+1,l=a.x[j],m=a.y[j],n=a.x[k],o=a.y[k],p=a.nx[j],q=a.ny[j],r=i,s=f-p*i,t=g-q*i;if(i>0){let a=(f-l)*(n-l)+(g-m)*(o-m);if(a<0||(f-n)*(l-n)+(g-o)*(m-o)<0){let b=f-(s=a<0?l:n),d=g-(t=a<0?m:o);if((r=Math.hypot(b,d))-h>c)return 0;p=b/r,q=d/r}}let u=r-h,v=s+p*(a.radius+u/2),w=t+q*(a.radius+u/2);return d.nx=e?-p:p,d.ny=e?-q:q,M(d,0,v,w,u,0),1}let O=0;function P(a,b){let c=-1/0;for(let d=0;d<a.count;d++){let e=a.nx[d],f=a.ny[d],g=a.x[d],h=a.y[d],i=1/0;for(let a=0;a<b.count;a++){let c=e*(b.x[a]-g)+f*(b.y[a]-h);c<i&&(i=c)}i>c&&(c=i,O=d)}return c}let Q=0,R=0;function S(a,b,c,d){return 1===a.count&&1===b.count?function(a,b,c,d){let e=b.x[0]-a.x[0],f=b.y[0]-a.y[0],g=Math.hypot(e,f),h=g-a.radius-b.radius;if(h>c)return 0;let i=g>1e-9?e/g:0,j=g>1e-9?f/g:1;d.nx=i,d.ny=j;let k=a.radius+h/2;return M(d,0,a.x[0]+i*k,a.y[0]+j*k,h,0),1}(a,b,c,d):1===b.count?N(a,b,c,d,!1):1===a.count?N(b,a,c,d,!0):function(a,b,c,d){let e=a.radius+b.radius,f=P(a,b),g=O;if(f-e>c)return 0;let h=P(b,a),i=O;if(h-e>c)return 0;let j=h>f+.05,k=j?b:a,l=j?a:b,m=j?i:g,n=m+1===k.count?0:m+1,o=k.nx[m],p=k.ny[m],q=0,r=1/0;for(let a=0;a<l.count;a++){let b=o*l.nx[a]+p*l.ny[a];b<r&&(r=b,q=a)}let s=q+1===l.count?0:q+1,t=k.x[m],u=k.y[m],v=k.x[n],w=k.y[n],x=l.x[q],y=l.y[q],z=l.x[s],A=l.y[s];if(Math.max(f,h)>.05){let a,b,f,g,h,i,l,n,o,p,r,s,B,C;a=v-t,b=w-u,f=z-x,g=A-y,h=t-x,i=u-y,l=a*a+b*b,n=f*f+g*g,o=f*h+g*i,p=a*h+b*i,B=(s=l*n-(r=a*f+b*g)*r)>1e-12?Math.max(0,Math.min(1,(r*o-p*n)/s)):0,(C=(r*B+o)/n)<0?(C=0,B=Math.max(0,Math.min(1,-p/l))):C>1&&(C=1,B=Math.max(0,Math.min(1,(r-p)/l))),Q=B,R=C;let D=Q,E=R;if((0===D||1===D)&&(0===E||1===E)){let a=t+(v-t)*D,b=u+(w-u)*D,f=x+(z-x)*E-a,g=y+(A-y)*E-b,h=Math.hypot(f,g);if(h-e>c||h<1e-9)return 0;let i=f/h,l=g/h,n=h-e,o=a+i*(k.radius+n/2),p=b+l*(k.radius+n/2);return j&&(i=-i,l=-l),d.nx=i,d.ny=l,M(d,0,o,p,n,m<<8|q<<1|1),1}}let B=v-t,C=w-u,D=Math.hypot(B,C),E=B/D,F=C/D,G=(x-t)*E+(y-u)*F,H=(z-t)*E+(A-u)*F,I=z,J=A,K=x,L=y,N=G-H;if(N>1e-9){if(H<0){let a=-H/N;I=z+(x-z)*a,J=A+(y-A)*a}if(G>D){let a=(D-H)/N;K=z+(x-z)*a,L=A+(y-A)*a}}let S=(I-t)*o+(J-u)*p,T=(K-t)*o+(L-u)*p;d.nx=j?-o:o,d.ny=j?-p:p;let U=0,V=(k.radius-l.radius-S)/2,W=(k.radius-l.radius-T)/2;return S-e<=c&&M(d,U++,I+o*V,J+p*V,S-e,m<<8|s<<1),T-e<=c&&M(d,U++,K+o*W,L+p*W,T-e,m<<8|q<<1|65536),U}(a,b,c,d)}function T(a,b,c,d,e,f){let g=-1,h=-1,i=1/0,j=1/0;for(let e=0;e<a.count;e++){let f=d-(b*a.x[e]+c*a.y[e])-a.radius;f<i?(h=g,j=i,g=e,i=f):f<j&&(h=e,j=f)}if(i>e)return 0;f.nx=b,f.ny=c;let k=0;for(let[d,l]of[[g,i],[h,j]]){if(d<0||l>e)continue;let g=a.radius+l/2;M(f,k++,a.x[d]+b*g,a.y[d]+c*g,l,d)}return k}let U=H();function V(a){a.pitch=a.yaw=a.pitchRate=a.yawRate=0,J(a)}let W=a=>a-2*Math.round(a/(2*Math.PI))*Math.PI;function X(a,b,c,d){if(!a.awake||d<120)return;let e=Math.max(1,a.radius),f=Math.min(6,(d-120)*.012);a.pitchRate+=f*c/e,a.yawRate-=f*b/e}let Y=(0,c.forwardRef)(function({height:a,onSizeLimitChange:g,onFullChange:h,className:i="",style:j,"aria-label":k="Playful shapes with gravity. Drag a shape or click empty space to add one.",...l},m){let n=(0,c.useRef)(null),o=(0,c.useRef)(null),p={...C,...l},q=(0,c.useRef)(p);q.current=p;let r=(0,c.useRef)(g);r.current=g;let s=(0,c.useRef)(h);s.current=h;let u=JSON.stringify(q.current);return(0,c.useEffect)(()=>o.current?.update(q.current),[u]),(0,c.useEffect)(()=>{if(!n.current)return;let a=q.current,b=function(a,b,c,g){let h=a.getContext("2d"),i=a.parentElement;if(!h||!i)return null;let j=E(b),k=[],l="#fff",m="#fff",n=()=>{let a=document.createElement("span");a.style.display="none",i.appendChild(a);let b=(b,c)=>(a.style.color=c,CSS.supports("color",b)&&(a.style.color=b),getComputedStyle(a).color),c=j.colors.map(a=>b(a,"#3c82f6"));l=b(j.background,"Canvas"),m=b(j.faceColor,"#ffffff"),c.join()!==k.join()&&o.clear(),k=c,a.remove()},o=new Map,p=function(){let a=[],b=[],c=[],d=new Map,e=new Map,f=[],g=0,h=0,i=0,j=1,k=null,l=()=>{let a=f.pop()??H();return a.fresh=!0,a};function m(b){if(b.awake){b.sleepTime=0;return}var c=b.island;if(c)for(let b of a)b.awake||b.island!==c||(b.awake=!0,b.sleepTime=0,b.island=0)}function n(a,b,c,d){let e=b?1048575&b.id:d;return((1048575&a.id)*1048576+e)*1024+32*c+(b?d:31)}function o(a,b,f,g,h){a.key=g,a.a=b,a.b=f,a.count=h,a.touching=!1;let i=d.get(g);for(let c=0;c<h;c++){let d=a.points[c],e=d.ax,g=d.ay;if(d.ax=e-b.x,d.ay=g-b.y,d.bx=f?e-f.x:0,d.by=f?g-f.y:0,d.normalImpulse=0,d.tangentImpulse=0,d.maxNormalImpulse=0,d.separation<.5&&(a.touching=!0),i){for(let a=0;a<i.count;a++)if(i.points[a].id===d.id){d.normalImpulse=i.points[a].normalImpulse,d.tangentImpulse=i.points[a].tangentImpulse;break}}}a.fresh=!i,e.set(g,a),c.push(a)}function p(a,b,c){for(let d=0;d<a.parts.length;d++){let e=a.parts[d];for(let g=0;g<b.parts.length;g++){let h=b.parts[g],i=h.cx-e.cx,j=h.cy-e.cy,p=e.bound+h.bound+c;if(i*i+j*j>p*p)continue;let q=l(),r=S(e,h,c,q);if(!r){f.push(q);continue}o(q,a,b,n(a,b,d,g),r),(q.fresh&&q.touching||k&&(k.body===a||k.body===b))&&(a.awake||m(a),b.awake||m(b))}}}function q(b){let c=b;for(;a[c.root]!==c;)c=a[c.root];return c}return{bodies:a,get awakeCount(){let b=0;for(let c of a)c.awake&&b++;return b},get contactCount(){return c.length},setBounds(a,b,c){h=a,i=b,j=c},add(c){L(c),a.push(c),b.push(c)},remove(f){let g=a.indexOf(f);if(!(g<0)){for(let c of(a.splice(g,1),b.splice(b.indexOf(f),1),k?.body===f&&(k=null),[d,e]))for(let[a,b]of c)(b.a===f||b.b===f)&&(b.a===f&&b.b&&m(b.b),b.b===f&&m(b.a),c.delete(a));c=c.filter(a=>a.a!==f&&a.b!==f)}},clear(){for(let d of(a.length=0,b.length=0,c))f.push(d);c=[],d.clear(),e.clear(),k=null},wake:m,wakeAll:function(){for(let b of a)b.awake=!0,b.sleepTime=0,b.island=0},step:function(m,r){let s="2d"!==r.depth;if(!h||!i||!a.reduce((a,b)=>a+ +!!b.awake,0))return;let t=m/4,u=1/t;for(let b of a){if(!b.awake)continue;let a=Math.hypot(b.vx,b.vy)+Math.abs(b.w)*b.radius;L(b,3+a*m)}let v=d;d=e,(e=v).clear();let w=c;for(let b of(c=[],a))b.skipped=!b.awake;for(let a=1;a<b.length;a++){let c=b[a],d=a-1;for(;d>=0&&b[d].minX>c.minX;)b[d+1]=b[d],d--;b[d+1]=c}for(let a=0;a<b.length;a++){let c=b[a];for(let d=a+1;d<b.length;d++){let a=b[d];if(a.minX>c.maxX)break;if(a.minY>c.maxY||a.maxY<c.minY||!c.awake&&!a.awake)continue;let e=3+(Math.hypot(c.vx-a.vx,c.vy-a.vy)+Math.abs(c.w)*c.radius+Math.abs(a.w)*a.radius)*m;c.id<a.id?p(c,a,e):p(a,c,e)}c.awake&&function(a,b){let c=!a.entered&&1===j,d=!a.entered&&-1===j;for(let e=0;e<a.parts.length;e++){let g=a.parts[e];for(let j of[g.cy+g.bound+b>=i&&!d?0:-1,g.cy-g.bound-b<=0&&!c?1:-1,g.cx-g.bound-b<=0?2:-1,g.cx+g.bound+b>=h?3:-1]){if(j<0)continue;let c=l(),d=0===j?T(g,0,1,i,b,c):1===j?T(g,0,-1,0,b,c):2===j?T(g,-1,0,0,b,c):T(g,1,0,h,b,c);if(!d){f.push(c);continue}o(c,a,null,n(a,null,e,j),d)}}}(c,3+Math.hypot(c.vx,c.vy)*m)}let x=new Set;for(let a of d.values())!(!a.a.skipped||a.b&&!a.b.skipped||e.has(a.key))&&(e.set(a.key,a),x.add(a),(a.a.awake||a.b&&a.b.awake)&&c.push(a));for(let a of w)x.has(a)||f.push(a);for(let b of a)b.touching=!1;for(let a of c){a.touching&&(a.a.touching=!0,a.b&&(a.b.touching=!0));let b=a.a,c=a.b,d=b.awake?b.inverseMass:0,e=b.awake?b.inverseInertia:0,f=c&&c.awake?c.inverseMass:0,g=c&&c.awake?c.inverseInertia:0,h=a.nx,i=a.ny,j=-h;for(let k=0;k<a.count;k++){let l=a.points[k],m=l.ax*i-l.ay*h,n=l.bx*i-l.by*h,o=d+f+e*m*m+g*n*n;l.normalMass=o>0?1/o:0;let p=l.ax*j-l.ay*i,q=l.bx*j-l.by*i,r=d+f+e*p*p+g*q*q;l.tangentMass=r>0?1/r:0;let s=b.vx-b.w*l.ay,t=b.vy+b.w*l.ax,u=c?c.vx-c.w*l.by:0,v=c?c.vy+c.w*l.bx:0;l.relativeVelocity=(u-s)*h+(v-t)*i,l.maxNormalImpulse=0}}let y=(a,b=10)=>{let c=2*Math.PI*a,d=2*b+t*c,e=t*c*d,f=1/(1+e);return{biasRate:c/d,massScale:e*f,impulseScale:f}},z=Math.min(60,.25*u),A=y(z),B=y(2*z),C=r.gravity,D=r.wind,E=1/(1+t*r.damping),F=1/(1+t*(r.damping+.35)),G=r.friction;for(let b of a)b.dx=b.dy=b.da=0;let H=y(18,1);for(let b=0;b<4;b++){for(let b of a)if(b.awake&&(b.vx=(b.vx+t*D)*E,b.vy=(b.vy+t*C)*E,b.w*=F,k?.body!==b)){let a=b.touching?5:9;b.w+=t*(-a*Math.sin(b.angle)-(b.touching?0:1.6*b.w))}if(k){let a=k,b=a.body,c=Math.cos(b.angle),d=Math.sin(b.angle),e=a.localX*c-a.localY*d,f=a.localX*d+a.localY*c,g=b.x+e-a.targetX,h=b.y+f-a.targetY,i=b.inverseMass,j=b.inverseInertia,l=i+j*f*f,m=-j*e*f,n=i+j*e*e,o=l*n-m*m||1,p=b.vx-b.w*f+H.biasRate*g,q=b.vy+b.w*e+H.biasRate*h,r=-H.massScale*((n*p-m*q)/o),s=-H.massScale*((l*q-m*p)/o),u=400*t*Math.max(400,Math.abs(C))/i,v=Math.hypot(r,s);v>u&&(r*=u/v,s*=u/v),b.vx+=i*r,b.vy+=i*s,b.w+=j*(e*s-f*r),b.w*=.9}for(let a of c){let b=a.a,c=a.b,d=b.awake?b.inverseMass:0,e=b.awake?b.inverseInertia:0,f=c&&c.awake?c.inverseMass:0,g=c&&c.awake?c.inverseInertia:0;for(let h=0;h<a.count;h++){let i=a.points[h],j=i.normalImpulse*a.nx+i.tangentImpulse*a.ny,k=i.normalImpulse*a.ny-i.tangentImpulse*a.nx;b.vx-=d*j,b.vy-=d*k,b.w-=e*(i.ax*k-i.ay*j),c&&(c.vx+=f*j,c.vy+=f*k,c.w+=g*(i.bx*k-i.by*j))}}for(let b of(K(!0),a)){if(!b.awake)continue;let a=Math.hypot(b.vx,b.vy);a>4200&&(b.vx*=4200/a,b.vy*=4200/a),b.x+=t*b.vx,b.y+=t*b.vy,b.angle+=t*b.w,b.angle>Math.PI?b.angle-=2*Math.PI:b.angle<-Math.PI&&(b.angle+=2*Math.PI),b.dx+=t*b.vx,b.dy+=t*b.vy,b.da+=t*b.w}K(!1)}let I=r.restitution;if(I>0)for(let a of c){let b=a.a,c=a.b,d=b.awake?b.inverseMass:0,e=b.awake?b.inverseInertia:0,f=c&&c.awake?c.inverseMass:0,g=c&&c.awake?c.inverseInertia:0;for(let h=0;h<a.count;h++){let i=a.points[h];if(i.relativeVelocity>-60||0===i.maxNormalImpulse)continue;let j=b.vx-b.w*i.ay,k=b.vy+b.w*i.ax,l=c?c.vx-c.w*i.by:0,m=c?c.vy+c.w*i.bx:0,n=(l-j)*a.nx+(m-k)*a.ny;s&&(X(b,i.ax,i.ay,-i.relativeVelocity),c&&X(c,i.bx,i.by,-i.relativeVelocity));let o=-i.normalMass*(n+I*i.relativeVelocity),p=Math.max(i.normalImpulse+o,0);o=p-i.normalImpulse,i.normalImpulse=p;let q=o*a.nx,r=o*a.ny;b.vx-=d*q,b.vy-=d*r,b.w-=e*(i.ax*r-i.ay*q),c&&(c.vx+=f*q,c.vy+=f*r,c.w+=g*(i.bx*r-i.by*q))}}function K(a){for(let b of c){let c=b.a,d=b.b,e=c.awake?c.inverseMass:0,f=c.awake?c.inverseInertia:0,g=d&&d.awake?d.inverseMass:0,h=d&&d.awake?d.inverseInertia:0,i=d&&d.awake&&c.awake?A:B,j=b.nx,k=b.ny,l=0;for(let m=0;m<b.count;m++){let n=b.points[m],o=c.dx-c.da*n.ay,p=c.dy+c.da*n.ax,q=((d?d.dx-d.da*n.by:0)-o)*j+((d?d.dy+d.da*n.bx:0)-p)*k+n.separation,r=0,s=1,t=0;q>0?r=q*u:a&&(r=Math.max(i.biasRate*Math.min(0,q+.5),-420),s=i.massScale,t=i.impulseScale);let v=c.vx-c.w*n.ay,w=c.vy+c.w*n.ax,x=((d?d.vx-d.w*n.by:0)-v)*j+((d?d.vy+d.w*n.bx:0)-w)*k,y=-n.normalMass*s*(x+r)-t*n.normalImpulse,z=Math.max(n.normalImpulse+y,0);y=z-n.normalImpulse,n.normalImpulse=z,y>n.maxNormalImpulse&&(n.maxNormalImpulse=y),l+=z;let A=y*j,B=y*k;c.vx-=e*A,c.vy-=e*B,c.w-=f*(n.ax*B-n.ay*A),d&&(d.vx+=g*A,d.vy+=g*B,d.w+=h*(n.bx*B-n.by*A))}let m=-j;for(let a=0;a<b.count;a++){let i=b.points[a],j=c.vx-c.w*i.ay,l=c.vy+c.w*i.ax,n=((d?d.vx-d.w*i.by:0)-j)*k+((d?d.vy+d.w*i.bx:0)-l)*m,o=G*i.normalImpulse,p=-i.tangentMass*n,q=Math.max(-o,Math.min(o,i.tangentImpulse+p));p=q-i.tangentImpulse,i.tangentImpulse=q;let r=p*k,s=p*m;c.vx-=e*r,c.vy-=e*s,c.w-=f*(i.ax*s-i.ay*r),d&&(d.vx+=g*r,d.vy+=g*s,d.w+=h*(i.bx*s-i.by*r))}if(l>0){let a=.004*l*Math.min(c.radius,d?d.radius:c.radius),b=(d?d.w:0)-c.w,e=f+h;if(e>0){let g=Math.max(-a,Math.min(a,-b/e));c.w-=f*g,d&&(d.w+=h*g)}}}}for(let b of a)if(b.awake&&!(b.growth<1)){if(!s){V(b);continue}(b.touching||k?.body===b)&&(b.pitch=W(b.pitch),b.yaw=W(b.yaw),b.pitchRate+=m*(-55*b.pitch-13*b.pitchRate),b.yawRate+=m*(-55*b.yaw-13*b.yawRate)),b.pitchRate=Math.max(-14,Math.min(14,b.pitchRate)),b.yawRate=Math.max(-14,Math.min(14,b.yawRate)),b.pitch+=m*b.pitchRate,b.yaw+=m*b.yawRate,b.touching&&Math.abs(b.pitch)+Math.abs(b.yaw)<.002&&Math.abs(b.pitchRate)+Math.abs(b.yawRate)<.05&&(b.pitch=b.yaw=b.pitchRate=b.yawRate=0),J(b)}for(let b of a)b.awake&&(L(b),!b.entered&&b.minY>=-1&&b.maxY<=i+1&&(b.entered=!0));for(let b=0;b<a.length;b++)a[b].root=b;let M=(a,b)=>{let c=q(a),d=q(b);c!==d&&(d.root=c.root)};for(let a of c)a.b&&a.a.awake&&a.b.awake&&a.touching&&M(a.a,a.b);let N=new Map;for(let b of a){if(!b.awake)continue;let a=Math.hypot(b.vx,b.vy)+Math.abs(b.w)*b.radius,c=k?.body===b||b.leaving>0||b.growth<1||!b.entered||b.turned||0!==b.pitchRate||0!==b.yawRate;b.sleepTime=a<7&&!c?b.sleepTime+m:0;let d=q(b);N.set(d,Math.min(N.get(d)??1/0,b.sleepTime))}let O=new Map;for(let[a,b]of N)b>=.45&&O.set(a,++g);if(!O.size)return;let P=new Map;for(let a of e.values()){if(!a.b||!a.touching)continue;let b=a.a.awake?a.a:a.b.awake?a.b:null,c=b===a.a?a.b:a.a;if(!b||c.awake||!c.island)continue;let d=O.get(q(b));d&&P.set(c.island,d)}for(let b of a)if(b.awake){let a=O.get(q(b));if(!a)continue;b.awake=!1,b.island=a,b.vx=b.vy=b.w=0}else P.has(b.island)&&(b.island=P.get(b.island))},grab(a,b,c){m(a);let d=Math.cos(a.angle),e=Math.sin(a.angle),f=b-a.x,g=c-a.y;k={body:a,localX:f*d+g*e,localY:g*d-f*e,targetX:b,targetY:c}},drag(a,b){k&&(k.targetX=a,k.targetY=b,m(k.body))},release(){k=null},get dragging(){return k?.body??null},overlaps(b,c=0){if(L(b),b.minX<-c||b.maxX>h+c||b.minY<-c||b.maxY>i+c)return!0;for(let d of a)if(!(d.minX>b.maxX)&&!(d.maxX<b.minX)&&!(d.minY>b.maxY)&&!(d.maxY<b.minY))for(let a of b.parts)for(let b of d.parts){let d=S(a,b,0,U);for(let a=0;a<d;a++)if(U.points[a].separation<-c)return!0}return!1}}}(),q=p.bodies,r=matchMedia("(prefers-reduced-motion: reduce)"),s=F(j.seed),u=0,v=0,y=1,z=0,C=0,D=0,G=0,M=0,N=0,O=0,P=1,Q=0,R=0,Y=!1,Z=!1,$=!1,_=!1,aa=!0,ab=!1,ac=[],ad=null,ae=-1,af=null,ag=a=>j.size*(1-a*j.sizeVariation),ah=()=>{let a=0;for(let b of q)b.leaving||(a+=b.shape.area*b.radius*b.radius);return a},ai=()=>u*v*.8,aj=()=>j.gravity>20?1:j.gravity<-20?-1:0,ak=new Map,al=()=>{let a=am(),b=ak.get(a)??Math.floor(6*s());return ak.set(a,b+1),{kind:a,variation:s(),color:b}},am=()=>{if("mixed"!==j.shape)return e(j.shape)?j.shape:"circle";if(!ac.length){ac=[...d];for(let a=ac.length-1;a>0;a--){let b=Math.floor(s()*(a+1));[ac[a],ac[b]]=[ac[b],ac[a]]}}return ac.pop()},an=new Float64Array(2048),ao=new Float64Array(2048),ap=new Int32Array(2048);function aq(a,b,c,d,e){var g,h;let i,j,l=w(a),m=ag(b),n=(g=P++,I(i={id:g,shape:l,x:d,y:e,angle:0,vx:0,vy:0,w:0,radius:m,growth:1,inverseMass:0,inverseInertia:0,awake:!0,sleepTime:0,island:0,entered:!1,outside:0,leaving:0,skipped:!1,touching:!1,pitch:0,yaw:0,pitchRate:0,yawRate:0,turned:!1,rotation:new Float64Array(9),paint:[],local:[],dx:0,dy:0,da:0,root:0,minX:0,minY:0,maxX:0,maxY:0,parts:[]},l),K(i,m),i),o=s()*Math.PI*2,p=.2+.6*s();return Object.assign(n,{kind:a,colorIndex:(h=k.length,(j=f[a])[Math.abs(Math.floor(c))%j.length]%Math.max(1,h)),variation:b,idleX:Math.cos(o)*p,idleY:Math.sin(o)*p,follow:s(),blinkPeriod:2.8+4*s(),blinkPhase:7*s(),age:0,eyes:new Float64Array(128),eyeCount:0,eyeVisible:0,eyeState:new Float64Array(5).fill(0/0),painted:new Float64Array(8).fill(0/0),pose:new Float64Array(4).fill(0/0)}),n}function ar(a=!1){if(!u||!v)return!1;ad??=al();let b=ah(),c=w(ad.kind);for(let a of j.sizeVariation>0?[ad.variation,1]:[0]){let d=ag(a);if(b+c.area*d*d>ai())continue;let e=aj(),f=0,g=0;if(e){let a=function(a,b){let c=w(a),d=aj(),e=(c.right-c.left)*b*1.04,f=(c.bottom-c.top)*b;if(e>u||f>v)return null;let g=Math.max(4,Math.min(24,.25*j.size)),h=Math.min(an.length,Math.ceil(u/g));for(let a of(an.fill(v,0,h),q)){if(a.leaving)continue;let b=Math.max(0,Math.floor(a.minX/g)),c=Math.min(h-1,Math.floor(a.maxX/g));for(let e=b;e<=c;e++){let b=an[e];for(let c of a.parts)for(let a of[e*g,(e+.5)*g,(e+1)*g]){let e=function(a,b,c){let{count:d,radius:e}=a,f=0/0,g=a=>{(Number.isNaN(f)||(c>0?a<f:a>f))&&(f=a)};for(let f=0;f<d;f++){let h=b-a.x[f];if(Math.abs(h)<=e){let b=Math.sqrt(e*e-h*h);g(a.y[f]-c*b)}if(1===d)break;let i=a.ny[f];if(c>0?i>=0:i<=0)continue;let j=f+1===d?0:f+1,k=a.x[f]+a.nx[f]*e,l=a.x[j]+a.nx[f]*e;if((b-k)*(b-l)>0||k===l)continue;let m=(b-k)/(l-k);g(a.y[f]+(a.y[j]-a.y[f])*m+i*e)}return f}(c,a,d);if(Number.isNaN(e))continue;let f=-1===d?v-e:e;f<b&&(b=f)}an[e]=b}}let i=Math.min(h,Math.ceil(e/g)),k=0,l=0,m=0;for(let a=0;a<h;a++){for(;l>k&&an[ap[l-1]]>=an[a];)l--;ap[l++]=a,ap[k]<=a-i&&k++,a>=i-1&&(ao[m++]=an[ap[k]])}let n=f+4,o=0;for(let a=0;a<m;a++)ao[a]>=n&&(o+=ao[a]-n+g);if(!o)return null;let p=s()*o,r=0;for(let a=0;a<m&&(ao[a]<n||(p-=ao[a]-n+g,r=a,!(p<=0)));a++);let t=Math.max(0,i*g-e);return{x:Math.min(u-e,r*g+s()*t)-c.left*b*1.02,y:-1===d?v-c.top*b+1:-c.bottom*b-1}}(ad.kind,d);if(!a)continue;({x:f,y:g}=a)}else{let b=aq(ad.kind,a,ad.color,0,0);P--;let c=!1;for(let a=0;a<24&&!c;a++)b.x=d+s()*Math.max(0,u-2*d),b.y=d+s()*Math.max(0,v-2*d),c=!p.overlaps(b);if(!c)continue;({x:f,y:g}=b)}let h=aq(ad.kind,a,ad.color,f,g);return h.vx=(s()-.5)*40,h.vy=60*e,h.w=(s()-.5)*j.spin*2,"2d"!==j.depth&&(h.pitchRate=(s()-.5)*j.spin*7,h.yawRate=(s()-.5)*j.spin*7),h.angle=(s()-.5)*.5,h.entered=0===e,p.add(h),ad=null,_=!1,aa=!0,au(),!0}return a&&au(),!1}function as(a,b){let c=ag((ad??=al()).variation),d=w(ad.kind);if(ah()+d.area*c*c>ai())return!1;let e=aq(ad.kind,ad.variation,ad.color,a,b);return(e.entered=!0,p.overlaps(e))?(P--,!1):(e.growth=!(j.appearanceDuration>0)||r.matches||j.paused?1:.02,K(e,e.radius),p.add(e),ad=null,aa=!0,au(),!0)}function at(){let a=ah(),b=ai();if(a<=b)return;let c=aj()||1;for(let d of q.filter(a=>!a.leaving).sort((a,b)=>1===c?a.minY-b.minY:b.maxY-a.maxY)){if(a<=b)break;d.leaving=1e-6,a-=d.shape.area*d.radius*d.radius}p.wakeAll()}function au(){if(!u||!v)return;let b=ah(),e=ai(),f=80;for(let a of d){let b=w(a);f=Math.min(f,u/(b.right-b.left)/1.05,v/(b.bottom-b.top)/1.05)}b>0&&(f=Math.min(f,j.size*Math.sqrt(e/b)));let h=Math.max(Math.min(j.size,8),Math.floor(10*f)/10),i=ag(+(j.sizeVariation>0));b+.9*Math.PI*i*i>e&&(_=!0),a.dataset.shapeMaxSize=String(h),a.dataset.shapeFull=String(_),a.dataset.shapeCount=String(q.length),h!==ae&&(ae=h,c?.(h)),_!==af&&(af=_,g?.(_))}let av=null,aw=null,ax=null,ay=b=>{let c=a.getBoundingClientRect();return{x:(b.clientX-c.left)/Math.max(1,c.width)*u,y:(b.clientY-c.top)/Math.max(1,c.height)*v}},az=()=>{aw=av?ay(av):null,j.followCursor&&aw&&(!ax||j.paused||r.matches)&&(ax={...aw,weight:1}),aa=!0},aA=a=>{let b=(M+a.blinkPhase)%a.blinkPeriod;return b<.16?Math.sin(Math.PI*b/.16):0},aB=(a,b)=>null!==b&&(a.maxX<b.x0||a.minX>b.x1||a.maxY<b.y0||a.minY>b.y1),aC=(a,b)=>({x0:a[b],y0:a[b+1],x1:a[b+2],y1:a[b+3]}),aD=[];function aE(a=null){if(a||(aa=!1),u&&v){for(let b of(h.setTransform(y,0,0,y,0,0),a&&(h.save(),h.beginPath(),h.rect(a.x0,a.y0,a.x1-a.x0,a.y1-a.y0),h.clip()),h.fillStyle=l,a?h.fillRect(a.x0,a.y0,a.x1-a.x0,a.y1-a.y0):h.fillRect(0,0,u,v),q)){if(aB(b,a))continue;let c=b.radius*b.growth;if(c<.5)continue;let d=Math.cos(b.angle)*y,e=Math.sin(b.angle)*y;if(b.turned){for(let a of(h.setTransform(d*c,e*c,-e*c,d*c,b.x*y,b.y*y),h.beginPath(),b.paint))x(h,a,1);h.fillStyle=k[b.colorIndex%k.length]??"#3c82f6",h.fill();continue}let f=function(a){let b=Math.ceil(4*Math.log2(Math.max(2,a.radius*y))),c=`${a.kind}|${a.colorIndex}|${b}`,d=o.get(c);if(!d){var e,f,g;let h,i,j;e=a.shape,f=k[a.colorIndex%k.length]??"#3c82f6",g=2**(b/4),(j=(i=function(a){if("u">typeof OffscreenCanvas)return new OffscreenCanvas(a,a);let b=document.createElement("canvas");return b.width=b.height=a,b}(h=Math.max(4,Math.ceil(2*(e.bound+.04)*g)+2))).getContext("2d"))&&function(a,b,c,d,e,f){for(let c of(a.beginPath(),b))x(a,c,d,e,f);a.fillStyle=c,a.fill()}(j,e.parts,f,g,h/2,h/2),d={image:i,extent:h/2/g,radius:g},o.set(c,d)}return d}(b);h.setTransform(d,e,-e,d,b.x*y,b.y*y);let g=f.extent*c;h.drawImage(f.image,-g,-g,2*g,2*g)}j.faces&&function(a){for(let b of(h.beginPath(),q)){let c=b.radius*b.growth;if(c<4||!b.eyeVisible||aB(b,a))continue;let d=Math.cos(b.angle),e=Math.sin(b.angle),f=d*y*c,g=e*y*c;h.setTransform(f,g,-g,f,b.x*y,b.y*y);let i=b.eyeCount;for(let a=0;a<2;a++){if(!(b.eyeVisible&1<<a))continue;let c=a*i*2;h.moveTo(b.eyes[c],b.eyes[c+1]);for(let a=1;a<i;a++)h.lineTo(b.eyes[c+2*a],b.eyes[c+2*a+1]);h.closePath()}}h.setTransform(1,0,0,1,0,0),h.fillStyle=m,h.fill()}(a),a&&h.restore()}}let aF=new Float64Array(8);function aG(a){if(!u||!v)return;let b=aD.splice(0),c=a=>{Number.isNaN(a.x0)||b.push(a)};for(let b of q){let d=j.faces&&function(a){let b=a.radius*a.growth,c=a.idleX,d=a.idleY,e=j.followCursor&&ax?ax:null;if(e&&a.follow<j.cursorFollowRatio){let f=Math.cos(a.angle),g=Math.sin(a.angle),h=e.x-a.x,i=e.y-a.y,j=h*f+i*g,k=i*f-h*g,l=Math.hypot(j,k)||1,m=Math.min(1,l/(2.6*Math.max(1,b))),n=e.weight??1;c+=(j/l*m-c)*n,d+=(k/l*m-d)*n}let f=1-.92*aA(a),g=a.eyeState;return!!(Math.abs(g[0]-c)>1e-4||Math.abs(g[1]-d)>1e-4||Math.abs(g[2]-f)>1e-4||g[3]!==a.pitch||g[4]!==a.yaw)&&(g[0]=c,g[1]=d,g[2]=f,g[3]=a.pitch,g[4]=a.yaw,a.eyeCount=function(a,b,c,d,e,f=null){let g,h=((g=A.get(a.kind))||(g=Float64Array.from(function(a,b){let c=Math.max(0,b-a),d=[];for(let b=0;b<=7;b++){let e=Math.PI+Math.PI*b/7;d.push(Math.cos(e)*a,-c+Math.sin(e)*a)}for(let b=0;b<=7;b++){let e=Math.PI*b/7;d.push(Math.cos(e)*a,c+Math.sin(e)*a)}return d}(a.eye.halfWidth,a.eye.halfHeight)),A.set(a.kind,g)),g),i=h.length/2,{spread:j}=a.eye,k=a.face,l=Math.hypot(b,c);if(l>1&&(b/=l,c/=l),B=3,"flat"===k.type){let a=b*k.maxU,g=c*k.maxV,{o:l,u:m,v:n}=k;if(f){let a=m[1]*n[2]-m[2]*n[1],b=m[2]*n[0]-m[0]*n[2],c=m[0]*n[1]-m[1]*n[0];(f[6]*a+f[7]*b+f[8]*c)*Math.sign(c||1)<.08*Math.hypot(a,b,c)&&(B=0)}for(let b=0;b<2;b++){let c=b?1:-1;for(let k=0;k<i;k++){let o=a+c*j+h[2*k],p=g+h[2*k+1]*d,q=l[0]+m[0]*o+n[0]*p,r=l[1]+m[1]*o+n[1]*p,s=l[2]+m[2]*o+n[2]*p,t=(b*i+k)*2;e[t]=f?f[0]*q+f[1]*r+f[2]*s:q,e[t+1]=f?f[3]*q+f[4]*r+f[5]*s:r}}return i}let m=Math.min(1,Math.hypot(b,c))*k.maxTurn,n=Math.sin(m),o=Math.cos(m),p=Math.hypot(b,c)||1,q=-c/p,r=b/p,{c:s,r:t}=k;for(let a=0;a<2;a++){let b=a?1:-1;for(let c=-1;c<i;c++){let g=(b*j+(c<0?0:h[2*c]))/t[0],k=(c<0?0:h[2*c+1])*d/t[1],l=Math.hypot(g,k),m=l>1e-9?Math.sin(l)/l:1,p=g*m,u=k*m,v=Math.cos(l),w=q*p+r*u,x=p*o+r*v*n+q*w*(1-o),y=u*o-q*v*n+r*w*(1-o),z=v*o+(q*u-r*p)*n;if(c<0){f&&f[6]*x+f[7]*y+f[8]*z<.12&&(B&=a?1:2);continue}let A=s[0]+t[0]*x,C=s[1]+t[1]*y,D=s[2]+t[2]*z,E=(a*i+c)*2;e[E]=f?f[0]*A+f[1]*C+f[2]*D:A,e[E+1]=f?f[3]*A+f[4]*C+f[5]*D:C}}return i}(a.shape,c,d,f,a.eyes,a.turned?a.rotation:null),a.eyeVisible=B,!0)}(b);aF[0]=b.minX-2,aF[1]=b.minY-2,aF[2]=b.maxX+2,aF[3]=b.maxY+2;let e=b.painted,f=b.pose,g=Number.isNaN(e[0])||Math.abs(f[0]-b.x)>.04||Math.abs(f[1]-b.y)>.04||Math.abs(f[2]-b.angle)>8e-4||f[3]!==b.growth||b.turned;g&&(f[0]=b.x,f[1]=b.y,f[2]=b.angle,f[3]=b.growth),g||a||(aF[0]=e[0],aF[1]=e[1],aF[2]=e[2],aF[3]=e[3]),j.faces&&(d||g||a)?function(a,b){let c=a.radius*a.growth,d=Math.cos(a.angle),e=Math.sin(a.angle),f=1/0,g=1/0,h=-1/0,i=-1/0,j=a.eyeCount;for(let b=0;b<2;b++)if(a.eyeVisible&1<<b)for(let k=0;k<j;k++){let l=(b*j+k)*2,m=a.eyes[l]*c,n=a.eyes[l+1]*c,o=a.x+m*d-n*e,p=a.y+m*e+n*d;o<f&&(f=o),o>h&&(h=o),p<g&&(g=p),p>i&&(i=p)}b[4]=f-2,b[5]=g-2,b[6]=h+2,b[7]=i+2,1/0===f&&(b[4]=b[5]=b[6]=b[7]=0/0)}(b,aF):(aF[4]=e[4],aF[5]=e[5],aF[6]=e[6],aF[7]=e[7]),!a&&(g?(c(aC(e,0)),c(aC(aF,0))):d&&(c(aC(e,4)),c(aC(aF,4)))),e.set(aF)}if(a||aa)return void aE();if(!b.length)return;for(let a=!0;a;){a=!1;for(let c=0;c<b.length&&!a;c++)for(let d=c+1;d<b.length;d++){let e=b[c],f=b[d];if(!(e.x1<f.x0)&&!(f.x1<e.x0)&&!(e.y1<f.y0)&&!(f.y1<e.y0)){e.x0=Math.min(e.x0,f.x0),e.y0=Math.min(e.y0,f.y0),e.x1=Math.max(e.x1,f.x1),e.y1=Math.max(e.y1,f.y1),b.splice(d,1),a=!0;break}}}let d=0;for(let a of b)a.x0=Math.max(0,Math.floor(a.x0*y)/y),a.y0=Math.max(0,Math.floor(a.y0*y)/y),a.x1=Math.min(u,Math.ceil(a.x1*y)/y),a.y1=Math.min(v,Math.ceil(a.y1*y)/y),d+=Math.max(0,a.x1-a.x0)*Math.max(0,a.y1-a.y0);if(d>u*v*.55)return void aE();for(let a of b)a.x1>a.x0&&a.y1>a.y0&&aE(a)}let aH=()=>!j.paused&&!r.matches,aI=()=>!Z&&Y&&!document.hidden,aJ=()=>aH()&&!$&&!_&&O<j.count&&j.count>0,aK=()=>{cancelAnimationFrame(z),clearTimeout(C),z=C=0,D=0,G=0},aL=()=>{aI()&&(clearTimeout(C),C=0,z||(z=requestAnimationFrame(aM)))};function aM(b){var c,d;if(z=0,!aI()){D=0;return}let e=performance.now(),f=D?Math.min(.1,(b-D)/1e3):1/60;D=b,aH()&&function(b){if(M+=b,aJ()){N+=b;let c=1/j.spawnRate;for(;N>=c&&O<j.count;){if(!ar()){N=c-.12,p.awakeCount||(_=!0,au());break}O++,a.dataset.shapeEmitted=String(O),N-=c}}else N=0;for(let a=q.length-1;a>=0;a--){let c=q[a];if(c.leaving){if(c.leaving+=b,c.growth=Math.max(0,1-c.leaving/.28),c.growth<=0){p.remove(c),Number.isNaN(c.painted[0])||aD.push(aC(c.painted,0)),au();continue}K(c,c.radius),p.wake(c)}else if(c.growth<1){c.age+=b;let a=Math.min(1,c.age/Math.max(.01,j.appearanceDuration));c.growth=Math.max(.02,1-(1-a)**3),K(c,c.radius),p.wake(c)}c.entered||c.leaving||(c.outside+=b,c.outside>2.5&&(c.leaving=1e-6,au()))}G+=b;let c=1/60,d=0;for(;G>=c&&d<3;)p.step(c,j),G-=c,d++;3===d&&(G=0)}(f);if(j.followCursor&&aw){ax??={...aw,weight:1};let a=1-Math.exp(-10*f);ax.x+=(aw.x-ax.x)*a,ax.y+=(aw.y-ax.y)*a,ax.weight+=(1-ax.weight)*a}else ax&&(ax.weight*=Math.exp(-8*f),ax.weight<.002&&(ax=null));if(aG(!1),c=1e3*f,d=performance.now()-e,ab||y<=1||!p.awakeCount||(Q+=Math.max(c,d),++R<40||(Q/R>24&&(ab=!0,aP()),Q=R=0)),function(){if(p.dragging||!(!ax||null!==aw&&.3>Math.abs(ax.x-aw.x)&&.3>Math.abs(ax.y-aw.y)&&ax.weight>.995))return!0;if(!aH())return!1;if(p.awakeCount||aJ())return!0;for(let a of q)if(a.leaving||a.growth<1||aA(a)>0)return!0;return!1}()){z=requestAnimationFrame(aM);return}if(D=0,!aH()||!j.faces||!q.length)return;let g=1/0;for(let a of q){let b=(M+a.blinkPhase)%a.blinkPeriod;g=Math.min(g,a.blinkPeriod-b)}let h=performance.now();C=window.setTimeout(()=>{C=0,M+=(performance.now()-h)/1e3-1/60,aL()},Math.max(16,1e3*g-16))}function aN(){let a=performance.now()+300,b=1/60;for(let c=0;c<2400&&performance.now()<a&&(!$&&!_&&O<j.count&&c%4==0&&(ar()?O++:p.awakeCount||(_=!0)),p.step(b,j),!_&&!(O>=j.count)||p.awakeCount);c++);for(let a of q)a.growth=1,K(a,a.radius);au()}function aO(){aK(),p.clear(),s=F(j.seed),ac=[],ak.clear(),ad=null,P=1,O=0,N=1/j.spawnRate,$=!1,_=!1,M=0,a.dataset.shapeEmitted="0",r.matches&&aN(),au(),aa=!0,aG(!0),aL()}function aP(){let b=i.clientWidth,c=i.clientHeight;if(!b||!c)return void aK();let d=ab?1:Math.min(devicePixelRatio||1,2);if(d!==y&&o.clear(),y=d,u&&v&&(u!==b||v!==c)){for(let a of q)a.x=a.x/u*b,a.y=a.y/v*c,L(a);ax&&(ax.x=ax.x/u*b,ax.y=ax.y/v*c),p.wakeAll()}u=b,v=c,p.setBounds(u,v,aj()),a.dataset.shapeRatio=String(y),a.width=Math.round(u*y),a.height=Math.round(v*y),_=!1,at(),au(),az(),r.matches&&q.length<j.count&&!$&&aN(),aG(!0),aL()}let aQ=null,aR=()=>{let b=aQ;aQ=null,p.release(),b&&a.hasPointerCapture(b.id)&&a.releasePointerCapture(b.id),a.dataset.dragging="false"},aS=a=>{if(aQ&&aQ.id===a.pointerId){if(!aQ.figure&&!aQ.moved&&"pointerup"===a.type){let b=ay(a);as(b.x,b.y)}aR(),_=!1,au(),aa=!0,aH()||aG(!0),aL()}},aT=a=>{Z||!["mouse","pen"].includes(a.pointerType)||(av={clientX:a.clientX,clientY:a.clientY},az(),j.followCursor&&(aH()||aG(!0),aL()))},aU=a=>{null===a.relatedTarget&&["mouse","pen"].includes(a.pointerType)&&(av=aw=null,(r.matches||!j.followCursor)&&(ax=null),aa=!0,aH()||aG(!0),aL())},aV=()=>{av&&(az(),aH()||aG(!0),aL())},aW=()=>{av=aw=null,aR(),aK(),aa=!0,aG(!0),aL()},aX=()=>{aK(),aO()},aY=0,aZ=()=>{cancelAnimationFrame(aY),aY=requestAnimationFrame(()=>{aY=0,Z||(n(),aG(!0))})},a$=new MutationObserver(aZ);for(let a=i;a;a=a.parentElement)a$.observe(a,{attributes:!0,attributeFilter:["data-theme","class","style"]});let a_=matchMedia("(prefers-color-scheme: dark)");a_.addEventListener("change",aZ);let a0=a=>{a.target instanceof Element&&a.target.contains(i)&&/^(--|color|background)/.test(a.propertyName)&&aZ()};document.addEventListener("transitionend",a0,!0);let a1=[["pointerdown",b=>{if(!j.interactive||aQ||0!==b.button)return;let c=ay(b),d=((a,b)=>{for(let c=q.length-1;c>=0;c--){let d=q[c];if(d.leaving)continue;let e=d.radius*d.growth,f=a-d.x,g=b-d.y;if(f*f+g*g>(d.shape.bound3*e)**2)continue;let h=Math.cos(d.angle),i=Math.sin(d.angle);if(.03>=t(d.paint,(f*h+g*i)/e,(g*h-f*i)/e))return d}return null})(c.x,c.y);aQ={id:b.pointerId,figure:d,...c,ox:0,oy:0,moved:!1},d&&(aQ.ox=c.x-d.x,aQ.oy=c.y-d.y,aH()&&p.grab(d,c.x,c.y),a.dataset.dragging="true"),a.setPointerCapture(b.pointerId),aL()}],["pointermove",a=>{if(!aQ||aQ.id!==a.pointerId)return;let b=ay(a);Math.hypot(b.x-aQ.x,b.y-aQ.y)>3&&(aQ.moved=!0);let c=aQ.figure;c&&(aH()?p.drag(b.x,b.y):(c.x=Math.max(0,Math.min(u,b.x-aQ.ox)),c.y=Math.max(0,Math.min(v,b.y-aQ.oy)),L(c),aa=!0,aG(!0))),aL()}],["pointerup",aS],["pointercancel",aS],["lostpointercapture",aS]];a1.forEach(([b,c])=>a.addEventListener(b,c));let a2=new ResizeObserver(aP);a2.observe(i);let a3=new IntersectionObserver(([a])=>{(Y=a.isIntersecting)||aR(),aK(),aL()});return a3.observe(i),document.addEventListener("visibilitychange",aW),window.addEventListener("blur",aW),window.addEventListener("pointermove",aT,{passive:!0}),window.addEventListener("pointerout",aU,{passive:!0}),window.addEventListener("scroll",aV,{passive:!0,capture:!0}),r.addEventListener("change",aX),n(),aP(),aO(),{reset:aO,add(){if(r.matches||j.paused){let a=as(u*(.15+.7*s()),v*(.1+.5*s()));return a&&aG(!0),a}let a=ar(!0);return aL(),a},clear(){aR(),p.clear(),$=!0,_=!1,au(),aG(!0)},shake(){if(!r.matches){for(let a of(p.wakeAll(),q))a.vx+=(s()-.5)*450,a.vy-=Math.sign(j.gravity||1)*(170+200*s()),a.w+=(s()-.5)*8;aL()}},update(b){let c=j;if(j=E(b),q.length&&j.size>c.size&&ae>0&&(j.size=Math.min(j.size,Math.max(c.size,ae))),n(),j.followCursor?az():ax=null,j.interactive||aR(),a.dataset.interactive=String(j.interactive),j.seed!==c.seed)return void aO();p.setBounds(u,v,aj());let d=j.shape!==c.shape;for(let a of q){if(d&&"mixed"!==j.shape){let b=e(j.shape)?j.shape:"circle";b!==a.kind&&(a.kind=b,I(a,w(b)))}a.colorIndex=a.colorIndex%Math.max(1,k.length),K(a,ag(a.variation)),L(a)}if(d&&(ac=[]),"2d"===j.depth)for(let a of q)V(a),L(a);ad=null,p.wakeAll(),_=!1,at(),au(),r.matches&&!$&&O<j.count&&aN(),aa=!0,aG(!0),j.paused&&aK(),aL()},destroy(){Z=!0,cancelAnimationFrame(aY),a$.disconnect(),a_.removeEventListener("change",aZ),document.removeEventListener("transitionend",a0,!0),aR(),aK(),a2.disconnect(),a3.disconnect(),a1.forEach(([b,c])=>a.removeEventListener(b,c)),document.removeEventListener("visibilitychange",aW),window.removeEventListener("blur",aW),window.removeEventListener("pointermove",aT),window.removeEventListener("pointerout",aU),window.removeEventListener("scroll",aV,!0),r.removeEventListener("change",aX),p.clear(),o.clear()}}}(n.current,a,a=>r.current?.(a),a=>s.current?.(a));return o.current=b,()=>{b?.destroy(),o.current=null}},[]),(0,c.useImperativeHandle)(m,()=>({replay:()=>o.current?.reset(),clear:()=>o.current?.clear(),addShape:()=>o.current?.add(),shake:()=>o.current?.shake()}),[]),(0,b.jsx)("div",{className:`shape-physics ${i}`.trim(),style:{height:a,background:p.background,...j},children:(0,b.jsx)("canvas",{ref:n,role:"img","aria-label":k,tabIndex:p.interactive?0:void 0,"data-interactive":p.interactive,onKeyDown:a=>{!p.interactive||a.metaKey||a.ctrlKey||a.altKey||("Enter"===a.key&&(a.preventDefault(),o.current?.add()),"r"===a.key.toLowerCase()&&o.current?.reset())}})})});a.s(["ShapePhysics",0,Y],41613)}]})();

//# sourceMappingURL=src_components_1b68entqujxea._.js.map
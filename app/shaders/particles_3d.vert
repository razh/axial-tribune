uniform sampler2D texture;

uniform float pointSize;
uniform vec3 scale;

void main() {
  gl_PointSize = pointSize;
  vec4 texel = texture2D(texture, position.xy);
  vec3 pos = texel.rgb * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(scale * pos, 1.0);
}

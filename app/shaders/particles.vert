uniform sampler2D texture;

uniform float pointSize;
uniform vec3 scale;

void main() {
  gl_PointSize = pointSize;
  vec3 pos = position;
  pos.z += texture2D(texture, position.xy).r - 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(scale * pos, 1.0);
}

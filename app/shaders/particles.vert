uniform float pointSize;
uniform float scale;

void main() {
  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(scale * position, 1.0);
}

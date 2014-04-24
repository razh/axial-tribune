uniform float pointSize;

varying vec4 vPosition;
varying vec4 vColor;

void main() {
  gl_PointSize = pointSize;
  gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}

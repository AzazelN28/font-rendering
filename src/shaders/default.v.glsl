#version 300 es
#ifdef GL_PRECISION_LOW
precision lowp float;
#else
precision mediump float;
#endif

layout (location = 0) in vec2 a_coords;
layout (location = 1) in vec2 a_texcoords;

uniform mat4 u_mvp;

out vec2 v_texcoords;

void main() {
  gl_Position = u_mvp * vec4(a_coords, 0.0, 1.0);
  v_texcoords = a_texcoords;
}

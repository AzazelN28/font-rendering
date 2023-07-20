#version 300 es
#ifdef GL_PRECISION_LOW
precision lowp float;
#else
precision mediump float;
#endif

uniform sampler2D s_texture;
uniform vec2 u_size;
uniform vec2 u_offset;
uniform vec2 u_position;
uniform float u_xadvance;

in vec2 v_texcoords;

out vec4 color;

float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {
  // Necesitamos el tamaño de la textura para poder obtener
  // las coordenadas relativas de la textura.
  ivec2 itexsize = textureSize(s_texture, 0);
  vec2 texsize = vec2(itexsize);
  // Obtenemos las coordenadas relativas a la textura.
  vec2 position = u_position / texsize;
  vec2 size = u_size / texsize;
  // Aquí ya hemos calculado las coordenadas relativas del
  // glifo que queremos pintar en pantalla.
  vec2 texcoords = v_texcoords * size + position;
  vec3 texcolor = texture(s_texture, texcoords).rgb;
  float sigDist = median(texcolor.r, texcolor.g, texcolor.b);
  float w = fwidth(sigDist);
  float opacity = smoothstep(0.5 - w, 0.5 + w, sigDist);
  // color = vec4(v_texcoords.x, v_texcoords.y, 0.0, 1.0);
  color = vec4(1.0, 1.0, 1.0, opacity);
}

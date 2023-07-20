export function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    throw new Error(`Could not compile WebGL shader. \n\n${info}`)
  }
  return shader
}

export function createVertexShader(gl, source) {
  return createShader(gl, gl.VERTEX_SHADER, source)
}

export function createFragmentShader(gl, source) {
  return createShader(gl, gl.FRAGMENT_SHADER, source)
}

export function createProgram(gl, vs, fs) {
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    throw new Error(`Could not compile WebGL program. \n\n${info}`)
  }
  return program
}

export function createProgramFromSource(gl, vss, fss) {
  const vs = createVertexShader(gl, vss)
  const fs = createFragmentShader(gl, fss)
  return createProgram(gl, vs, fs)
}

export function getProgramAttributes(gl, program) {
  const attributes = new Map()
  const count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveAttrib(program, i)
    const location = gl.getAttribLocation(program, info.name)
    attributes.set(info.name, { info, location })
  }
  return attributes
}

export function getProgramUniforms(gl, program) {
  const uniforms = new Map()
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)
    const location = gl.getUniformLocation(program, info.name)
    uniforms.set(info.name, { info, location })
  }
  return uniforms
}

export function createBuffer(gl, target, data, usage = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(target, buffer)
  gl.bufferData(target, data, usage)
  return buffer
}

export function createTexture2D(gl, imageData) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData)
  // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  // Si no especifico esto NO RENDERIZA NADA.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  // gl.generateMipmap(gl.TEXTURE_2D)
  return texture
}

export default {
  createShader,
  createVertexShader,
  createFragmentShader,
  createProgram,
  createProgramFromSource,
  createBuffer,
  createTexture2D,
}

import { mat4, vec2, vec3 } from 'gl-matrix'
import './style.css'
import vs from './shaders/default.v.glsl'
import fs from './shaders/default.f.glsl'
import { createBuffer, createProgramFromSource, createTexture2D, getProgramAttributes, getProgramUniforms } from './webgl.js'

async function loadImageBitmap(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return createImageBitmap(blob)

  /*
  return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject()
      image.src = url
  })
  */
}

async function loadMSDF(url, baseURL) {
  const response = await fetch(url)
  const descriptor = await response.json()
  const pages = await Promise.all(descriptor.pages.map((page) => loadImageBitmap(`${baseURL}/${page}`)))
  return {
    descriptor,
    pages
  }
}

function drawGlyph({ gl, resources, msdf }, char) {
  const descriptor = msdf.descriptor.chars.find((charDescriptor) => charDescriptor.char === char)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  gl.useProgram(resources.programs.get('default').program)

  gl.bindTexture(gl.TEXTURE_2D, resources.textures.get('page_0'))
  gl.uniform1i(
    resources.programs.get('default').uniforms.get('s_texture').location,
    0
  )

  gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffers.get('quad'))
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8)

  if (resources.programs.get('default').uniforms.has('u_position')) {
    gl.uniform2f(
      resources.programs.get('default').uniforms.get('u_position').location,
      descriptor.x,
      descriptor.y
    )
  }
  if (resources.programs.get('default').uniforms.has('u_size')) {
    gl.uniform2f(
      resources.programs.get('default').uniforms.get('u_size').location,
      descriptor.width,
      descriptor.height
    )
  }
  if (resources.programs.get('default').uniforms.has('u_offset')) {
    gl.uniform2f(
      resources.programs.get('default').uniforms.get('u_offset').location,
      descriptor.xoffset,
      descriptor.yoffset
    )
  }
  if (resources.programs.get('default').uniforms.has('u_xadvance')) {
    gl.uniform1f(
      resources.programs.get('default').uniforms.get('u_xadvance').location,
      descriptor.xadvance
    )
  }

  gl.uniformMatrix4fv(
    resources.programs.get('default').uniforms.get('u_mvp').location,
    false,
    resources.matrices.get('modelViewProjection')
  )

  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
}

function update({ resources }) {
  mat4.identity(resources.matrices.get('model'))
  mat4.translate(resources.matrices.get('model'), resources.matrices.get('model'), resources.data.get('position'))
  mat4.scale(resources.matrices.get('model'), resources.matrices.get('model'), resources.data.get('scale'))

  mat4.identity(resources.matrices.get('view'))
  mat4.invert(resources.matrices.get('view'), resources.matrices.get('view'))

  mat4.multiply(resources.matrices.get('modelView'), resources.matrices.get('view'), resources.matrices.get('model'))
  mat4.multiply(resources.matrices.get('viewProjection'), resources.matrices.get('projection'), resources.matrices.get('view'))
  mat4.multiply(resources.matrices.get('modelViewProjection'), resources.matrices.get('viewProjection'), resources.matrices.get('model'))

  // mat4.identity(resources.matrices.get('modelViewProjection'))
}

function render(frameContext) {
  const { gl, canvas } = frameContext
  gl.viewport(0, 0, canvas.width, canvas.height)

  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)

  drawGlyph(frameContext, 'A')
}

function resizeTo(canvas, width, height) {
  let resized = false
  if (canvas.width !== width) {
    canvas.width = width
    resized = true
  }
  if (canvas.height !== height) {
    canvas.height = height
    resized = true
  }
  return resized
}

function resizeAuto(canvas, multiplier = 1.0) {
  return resizeTo(
    canvas,
    Math.floor(canvas.clientWidth * multiplier),
    Math.floor(canvas.clientHeight * multiplier)
  )
}

async function main() {
  const canvas = document.querySelector('#msdf')
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    premultipliedAlpha: false  // Ask for non-premultiplied alpha
  })

  const resources = {
    programs: new Map(),
    textures: new Map(),
    buffers: new Map(),
    framebuffers: new Map(),
    renderbuffers: new Map(),
    vertexArrays: new Map(),
    matrices: new Map(),
    data: new Map()
  }

  const msdf = await loadMSDF(import.meta.env.BASE_URL + '/msdf/Corben-Regular.json', import.meta.env.BASE_URL + '/msdf')
  console.log(msdf)

  resources.matrices.set('projection',
    mat4.ortho(mat4.create(), 0, canvas.width, canvas.height, 0, -1, 1)
  )
  resources.matrices.set('modelViewProjection', mat4.create())
  resources.matrices.set('modelView', mat4.create())
  resources.matrices.set('viewProjection', mat4.create())
  resources.matrices.set('view', mat4.create())
  resources.matrices.set('model', mat4.create())
  const program = createProgramFromSource(gl, vs, fs)
  const uniforms = getProgramUniforms(gl, program)
  const attributes = getProgramAttributes(gl, program)
  resources.programs.set('default', { program, uniforms, attributes })
  resources.textures.set('page_0', createTexture2D(gl, msdf.pages.at(0)))
  resources.buffers.set('quad', createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 0, 0,
    1, -1, 1, 0,
    1, 1, 1, 1,
    -1, 1, 0, 1,
  ])))

  const frameContext = { canvas, gl, msdf, resources }

  let frameId
  function onFrame(time) {
    if (resizeAuto(canvas)) {
      mat4.ortho(resources.matrices.get('projection'), 0, canvas.width, canvas.height, 0, -1, 1)
    }
    update(frameContext)
    render(frameContext)
    frameId = requestAnimationFrame(onFrame)
  }

  resources.data.set('scale', vec3.fromValues(310, 300, 1))
  window.addEventListener('wheel', (e) => {
    e.preventDefault()
    console.log(e)
    if (e.deltaY > 0) {
      vec3.multiply(
        resources.data.get('scale'),
        resources.data.get('scale'),
        vec3.fromValues(0.5, 0.5, 1)
      )
    } else {
      vec3.multiply(
        resources.data.get('scale'),
        resources.data.get('scale'),
        vec3.fromValues(2, 2, 1)
      )
    }
  })

  resources.data.set('position', vec3.fromValues(400, 400, 0))
  window.addEventListener('pointermove', (e) => {
    if (e.pressure > 0) {
      vec3.add(
        resources.data.get('position'),
        resources.data.get('position'),
        vec3.fromValues(e.movementX, e.movementY, 0)
      )
    }
  })

  frameId = requestAnimationFrame(onFrame)
}

main()

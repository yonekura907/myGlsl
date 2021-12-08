#ifdef GL_ES
precision mediump float;
#endif

void main(){
  vec3 color=vec3(.3,.4,.7);
  gl_FragColor=vec4(color,1);
}

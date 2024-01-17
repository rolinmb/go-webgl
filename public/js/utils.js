var UTILS = {
  degToRad: function(theta) {return(theta*Math.PI/180);},
  getProjection: function(theta, a, zMin, zMax) {
    let tan = Math.tan(UTILS.degToRad(0.5*theta));
    let A = -(zMax+zMin)/(zMax-zMin);
    let b = (-2*zMax*zMin)/(zMax-zMin);
    return [
      0.5/tan, 0, 0, 0,
      0, 0.5*a/tan, 0, 0,
      0, 0, A, -1,
      0, 0, b, 0
    ];
  },
  getId4: function() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  },
  resetId4: function(m) {
    m[0]=1, m[1]=0, m[2]=0, m[3]=0,
    m[4]=0, m[5]=1, m[6]=0, m[7]=0,
    m[8]=0, m[9]=0, m[10]=1, m[11]=0,
    m[12]=0, m[13]=0, m[14]=0, m[15]=1;
  },
  rotateX: function(m, theta) {
    let c = Math.cos(theta);
    let s = Math.sin(theta);
    let mv1 = m[1], mv5 = m[5], mv9 = m[9];
    m[1] = m[1]*c-m[2]*s;
    m[5] = m[5]*c-m[6]*s;
    m[9] = m[9]*c-m[10]*s;
    m[2] = m[2]*c+mv1*s;
    m[6] = m[6]*c+mv5*s;
    m[10] = m[10]*c+mv9*s;
  },
  rotateY: function(m, theta) {
    let c = Math.cos(theta);
    let s = Math.sin(theta);
    let mv0=m[0], mv4=m[4], mv8=m[8];
    m[0]=c*m[0]+s*m[2];
    m[4]=c*m[4]+s*m[6];
    m[8]=c*m[8]+s*m[10];
    m[2]=c*m[2]-s*mv0;
    m[6]=c*m[6]-s*mv4;
    m[10]=c*m[10]-s*mv8;
  },
  rotateZ: function(m, theta) {
    let c = Math.cos(theta);
    let s = Math.sin(theta);
    let mv0=m[0], mv4=m[4], mv8=m[8];
    m[0]=c*m[0]-s*m[1];
    m[4]=c*m[4]-s*m[5];
    m[8]=c*m[8]-s*m[9];
    m[1]=c*m[1]+s*mv0;
    m[5]=c*m[5]+s*mv4;
    m[9]=c*m[9]+s*mv8;
  },
  translateZ: function(m, x) {
    m[14] += x;
  }
};

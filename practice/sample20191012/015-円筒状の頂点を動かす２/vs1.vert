attribute vec3  position;  // 頂点座標
attribute vec4  color;     // 頂点色
uniform   mat4  mvpMatrix; // MVP 座標変換行列
uniform   float time;      // 時間
varying   vec4  vColor;

const float PI = 3.1415926;

void main(){
    vColor = color;

    // 頂点の Y 座標の値をもとにラジアンに相当する値を生成する
    float rad = sin(position.y + time) * PI;
    // ラジアンからサインとコサインを求める
    float s = sin(rad);
    float c = cos(rad);
    // サインとコサインを使って回転行列を定義する
    mat2 m = mat2(c, s, -s, c);
    // 回転行列を使って、頂点の XZ 座標を回転させる
    vec2 v = m * position.xz;
    // 回転した XZ 座標と、もともとの Y 座標を組み合わせる
    vec3 p = vec3(v.x, position.y, v.y);

    // 補正後の頂点座標を行列と乗算する
    gl_Position = mvpMatrix * vec4(p, 1.0);

    gl_PointSize = 4.0;
}

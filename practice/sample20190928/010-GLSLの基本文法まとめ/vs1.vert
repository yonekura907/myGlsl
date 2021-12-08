/* GLSL のデータ型（主として利用するもの）
 * int:       整数
 * float:     浮動小数点
 * bool:      真偽値
 * bvec系:    真偽値ベクトル（bvec2 ～ bvec4 があり中身は bool）
 * vec系:     ベクトル（vec2 ～ vec4 があり中身は float）
 * mat系:     行列（mat2 ～ mat4 があり中身は float）
 * sampler系: サンプラ（始めはテクスチャと読み替えても良い）
 *
 * GLSL のデータ型と値
 * JavaScript などと違い、GLSL は型と値の定義が非常に厳密。
 * int 型で宣言した変数に float に相当する値などは入れられないので注意。
 * 例: int i = 0.0; // エラーになる
 *
 * vec系変数の書き方
 * ベクトルを宣言する際には `vec3 v = vec3(???)` といった初期化が行える。
 * このとき、以下の記述はいずれも同じ意味になる。
 * 例１: vec3 v = vec3(1.0);
 * 例２: vec3 v = vec3(1.0, 1.0, 1.0);
 *
 * vec系で利用できるスウィズル演算子
 * `v.xyz` というようにピリオドに繋げて xyz などの記号（演算子）を利用できる。
 * スウィズル演算子には xyzw と rgba の他、stpq があり、それぞれに意味はまったく同じ。
 * ただし xyzw と rgba のような異なるタイプを混在させることはできないので注意。
 * ※ xyba のようなことはできない、ということ
 *
 * GLSL の定数
 * const 修飾子を利用すると定数が宣言できる。
 * 例: const vec3 defaultColor = vec3(1.0);
 *
 * GLSL のマクロ（代表的なもの）
 * `#define` を使うとマクロを定義できる。
 * 例:
 * #define F float
 * F v = 1.0; // エラーにならない
 *
 * GLSL での関数定義
 * 戻り値の型などを一緒に記述する C 言語スタイル。
 * さらに、呼び出し前に定義が完了していなければならない点に注意すること。
 *
 * vec系などの四則演算
 * vec系の四則演算（- + * /）は、それぞれの要素ごとに計算される。
 * 一般的な数学的解釈ではベクトル同士の乗算、除算はできないと説明される事が多い。
 * GLSL の場合は XYZW のそれぞれの要素が個別に四則演算されるので注意。
 * 例:
 * vec3 v = vec3(0.0, 1.0, 2.0);
 * vec3 w = vec3(5.0, 6.0, 7.0);
 * vec3 x = v * w; // x === vec3(0.0, 6.0, 14.0)
 *
 * GLSL のビルトイン変数、関数
 * 基本的には仕様をちゃんと確認する癖をつけるのがよい。
 * https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf
 * `gl_` というプレフィックスが付く変数はビルトイン変数。（もともと定義されている変数）
 *
 * GLSL では変数には必ず初期値を設定する
 * 宣言のみを行い、値を代入しないような書き方は構文的にはできる。
 * しかし中身が不定となり思わぬ不具合を誘発するので必ず初期化する癖をつけるが吉。
 *
 * GLSL では、C 言語と同じスタイルの if 文や for 文を使うことができる。
 */

attribute vec3  position;
attribute float ratio;
uniform   float time;
varying   vec3  vColor; // 色 @@@

const float PI = 3.1415926;
const float RADIUS = 0.5;

// HSV カラーを生成する関数 @@@
vec3 hsv(float h, float s, float v){
    vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
    return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}

float sinWave(float timeScale, float waveLength, float waveHeight){
    float t = ratio + time * timeScale;
    float s = sin(2.0 * PI * waveLength * t);
    return s * waveHeight;
}

void main(){
    // ratio からサイン波を作る
    float wave = sinWave(0.1, 8.0, 0.025);
    float radius = RADIUS + wave;

    // ratio からラジアンを作り、円形に配置する
    float radian = PI * 2.0 * ratio;
    float s = sin(radian) * radius;
    float c = cos(radian) * radius;
    vec3 p = vec3(c, s, 0.0);

    // ratio を元に色を算出 @@@
    vColor = hsv(ratio, 1.0, 1.0);

    gl_Position = vec4(position + p, 1.0);
    gl_PointSize = 8.0;
}

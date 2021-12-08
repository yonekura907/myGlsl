attribute vec3  position;
attribute float ratio; // 0.0 ~ 1.0
uniform   float time;  // 経過時間 @@@
void main(){
    // 新たに時間の経過が uniform 変数で送られてくるようになっています。
    // ひとつ前のサンプルで一直線に並ぶようにした頂点たちを、時間の経過を
    // うまく利用してサイン波で揺らしてみましょう。
    gl_Position = vec4(position, 1.0);
    gl_PointSize = 8.0;
}

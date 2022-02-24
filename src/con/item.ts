import ballVs from '../glsl/simple.vert';
import ballFs from '../glsl/item.frag';
import boxVs from '../glsl/base.vert';
import boxFs from '../glsl/box.frag';
import { MyObject3D } from "../webgl/myObject3D";
import { Util } from "../libs/util";
import { Mesh } from 'three/src/objects/Mesh';
import { DoubleSide } from 'three/src/constants';
import { Func } from "../core/func";
import { Vector3 } from "three/src/math/Vector3";
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial';
import { Color } from 'three/src/math/Color';
import { Object3D } from "three/src/core/Object3D";
import { Conf } from "../core/conf";
import { Scroller } from "../core/scroller";
import { Val } from '../libs/val';
import { Tween } from '../core/tween';
import { Param } from '../core/param';

export class Item extends MyObject3D {

  private _id:number
  private _boxCon:Object3D
  private _box:Array<Object3D> = []
  private _mesh:Array<Object3D> = []
  private _shakeVal:Val = new Val()
  private _isShake:boolean = false
  private _posNoise:Vector3 = new Vector3()

  public itemPos:Vector3 = new Vector3()
  public itemSize:Vector3 = new Vector3()

  constructor(opt:any = {}) {
    super()

    this._id = opt.id

    this.itemPos.x = opt.ix
    this.itemPos.y = opt.iy

    this._boxCon = new Object3D()
    this.add(this._boxCon)

    // ハコ
    for(let i = 0; i < 6; i++) {
      const box = new Mesh(
        opt.boxGeo,
        new ShaderMaterial({
          vertexShader:boxVs,
          fragmentShader:boxFs,
          transparent:true,
          side:DoubleSide,
          uniforms:{
            alpha:{value:1},
            gray:{value:1},
            brightness:{value:i == 2 ? -0.25 : 0},
            color:{value:new Color(opt.col[i])},
          }
        })
      )
      this._boxCon.add(box)
      this._box.push(box)
    }

    // ボール
    for(let i = 0; i < 1; i++) {
      const m = new Mesh(
        opt.ballGeo,
        new ShaderMaterial({
          vertexShader:ballVs,
          fragmentShader:ballFs,
          transparent:true,
          side:DoubleSide,
          uniforms:{
            alpha:{value:1},
            shadow:{value:1},
            color:{value:new Color(opt.col[i])},
          }
        })
      )
      this.add(m)
      this._mesh.push(m)
    }
  }


  private _shake():void {
    if(this._isShake) return
    this._isShake = true

    Tween.instance.a(this._shakeVal, {
      val:[0, 1]
    }, 0.2, 0, null, null, () => {
      const r = 1
      this._posNoise.x = Util.instance.range(r)
      this._posNoise.y = Util.instance.range(r)
    }, () => {
      this._posNoise.x = this._posNoise.y = 0
    })
  }


  // ---------------------------------
  // 更新
  // ---------------------------------
  protected _update():void {
    super._update()

    const sw = Func.instance.sw()
    const sh = Func.instance.sh()
    const s = Scroller.instance.val.y

    const start = Util.instance.map(this._id, 0, sh * (Conf.instance.SCROLL_HEIGHT - 2), 0, Conf.instance.ITEM_NUM - 1)
    const fixRate = Util.instance.map(s, 0, 1, start, start + sh * 0.5)

    let rate = fixRate
    if(!Param.instance.isStart) rate = 0

    if(rate >= 1) {
      this._shake()
    } else {
      this._isShake = false
    }

    const size = Math.min(sw, sh) * 0.15
    this.itemSize.x = size

    // ハコ
    const bs = this.itemSize.x
    const d = this.itemSize.x * 0.5
    this._box[0].visible = false
    this._box[1].scale.set(bs, bs, 1)
    this._box[1].quaternion.setFromAxisAngle(new Vector3(0,1,0), Util.instance.radian(-90))
    this._box[1].position.x = d
    this._box[2].scale.set(bs, bs, 1)
    this._box[2].quaternion.setFromAxisAngle(new Vector3(1,0,0), Util.instance.radian(-90))
    this._box[2].position.y = -d
    this._box[3].scale.set(bs, bs, 1)
    this._box[3].quaternion.setFromAxisAngle(new Vector3(0,1,0), Util.instance.radian(90));
    this._box[3].position.x = -d
    this._box[4].scale.set(bs, bs, 1)
    this._box[4].quaternion.setFromAxisAngle(new Vector3(0,0,0), Util.instance.radian(0));
    this._box[4].position.z = -d
    this._box[5].scale.set(bs, bs, 1)
    this._box[5].quaternion.setFromAxisAngle(new Vector3(1,0,0), Util.instance.radian(180));
    this._box[5].position.z = d

    // 入ったらカラーにする
    this._box.forEach((val) => {
      this._setUni(val as Mesh, 'gray', rate >= 1 ? 0 : 1)
    })

    const boxShakeRange = size * 0.5
    // this._boxCon.position.x = this._posNoise.x * boxShakeRange
    this._boxCon.position.y = Math.abs(this._posNoise.y) * -1 * boxShakeRange

    // ボール
    const itemShakeRange = size * -0.1
    const item = this._mesh[0]
    item.visible = rate > 0.0001
    item.position.x = 0 + this._posNoise.x * itemShakeRange
    item.position.y = Util.instance.mix(sh * 1.25, 0, rate) + this._posNoise.y * itemShakeRange
    // item.rotation.z = Util.instance.radian(this._posNoise.x * 60)
    const ballSizeOffset = 0.7
    item.scale.set(size * ballSizeOffset, size * ballSizeOffset, size * ballSizeOffset)
  }
}
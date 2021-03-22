import { observable, action, makeObservable } from 'mobx';
import { del, post, get } from "~/request";
import { message } from 'antd';

//批量删除数组商品方法
const delProducts = (oldArray: any, cardIds: any) => {
  for (let i = 0; i < oldArray.length; i++) {
    const item = oldArray[i];
    for (let index = 0; index < cardIds.length; index++) {
      const x = cardIds[index];
      if (item.cartId === x) {
        oldArray.splice(i, 1);
      }
    }
  }
  return oldArray;
};

class Store {
  constructor() {
    makeObservable(this);
  }

  //购物车列表
  @observable chartItems = [] as any;

  //总价格
  @observable priceTotal = 0;

  //选中的数量
  @observable totalProcuts = 0 as number;

  //购物车是否为空
  @observable isNull = false as boolean;

  //除去失效的商品列表总数量
  @observable allTotal = 0 as number;

  //全选状态
  @observable selectTotal = false as boolean;

  //优惠券列表
  @observable couponList = [] as any;

  //除去失效的商品列表cartId集合
  @observable cartIds = [] as any;

  ///最佳优惠券计算文字tips
  @observable nextCoupon = {} as any;

  //初始化
  @action.bound init() {
    this.queryCart();
    this.getCoupon();
  }

  //查询购物车
  async queryCart() {
    await get("/cart").then((res: any) => {
      if (res.list.length > 0) {
        this.setChartItems(res.list);
      } else {
        this.isNull = true;
      }
    });
  }

  //查询购物车列表
  @action.bound setChartItems = (items: any) => {
    if (items.length > 0) {
      //储存购物车数据
      this.chartItems = items;
      this.isNull = false;
      let allTotal = 0;
      items.map((item: any) => {
        if (!item.isValid) {
          allTotal++;
        }
      });
      this.allTotal = allTotal;
    } else {
      this.isNull = true;
      this.allTotal = 0;
      this.chartItems = [];
    }
  };

  //优惠券
  async getCoupon() {
    await get(`couponRecord?status=UNUSED`, { pageNum: 50 }).then((res: any) => {
      if (res.list.length > 0) {
        this.couponList = res.list;
      }
    });
  }

  //更新选中当前商品购物车列表
  @action.bound updateChartItems = async (newItem: any) => {
    //请求接口添加到购物车
    await post("/cart", {
      id: newItem.cartId,
      goodsId: newItem.goodsId,
      skuId: newItem.skuId,
      goodsNum: newItem.goodsNum,
    }).then((res: any) => {
      let priceTotal = 0;
      let totalProcuts = 0;
      let cartIds = [] as any;
      const newItems = this.chartItems.map((item: any) => {
        if (item.cartId === newItem.cartId) {
          item = newItem;
        }
        if (item.select && !item.isValid) {
          priceTotal = priceTotal + item.salePrice * item.goodsNum;
          totalProcuts++;
          cartIds = [...cartIds, item.cartId];
        }
        return item;
      });
      //更新购物车列表
      this.chartItems = newItems;
      //更新选中的数量
      this.totalProcuts = totalProcuts;
      //更新总价格
      this.priceTotal = priceTotal;
      //更新选择的商品id合集数组
      this.cartIds = cartIds;
      //更新全选状态
      this.selectTotal = this.allTotal > 0 ? this.totalProcuts === this.allTotal : false;
      //更新优惠券计算
      this.couponList.length > 0 && totalProcuts > 0 && this.bestCoupon();
    });
  }

  //计算总价格和选中的数量
  @action.bound compuntePriceTotal = () => {
    let price = 0;
    let total = 0;
    let cartIds = [] as any;
    const newItems = this.chartItems.map((item: any) => {
      if (!item.isValid && item.select) {
        //计算总价格
        price = price + item.goodsNum * item.salePrice;
        //计算选中商品数量
        total++;
        cartIds = [...cartIds, item.cartId];
      }
      return item;
    });
    //更新购物车列表
    this.chartItems = newItems;
    //更新总价格
    this.priceTotal = price;
    //更新选中的数量
    this.totalProcuts = total;
    //更新选择的商品id合集数组
    this.cartIds = cartIds;
    //全选状态
    this.selectTotal = this.allTotal > 0 ? this.totalProcuts === this.allTotal : false;
  }

  //更改全选状态
  @action.bound changeSelectTotal = () => {
    this.selectTotal = !this.selectTotal;
    if (this.totalProcuts === this.allTotal) {
      this.selectTotal = false;
    }
    let allTotal = 0;
    const newItems = this.chartItems.map((item: any) => {
      item.select = this.selectTotal;
      if (!item.isValid) {
        allTotal++;
      }
      return item;
    });
    //更新购物车列表
    this.chartItems = newItems;
    //更新除去失效的商品列表总数量
    this.allTotal = allTotal;
    //选中状态计算总价格
    this.compuntePriceTotal();
    //更新优惠券计算
    this.couponList.length > 0 && this.totalProcuts > 0 && this.bestCoupon();
  }

  //批量删除商品
  @action.bound removeInvalid = async (content: any) => {
    //查找批量的选择的商品
    let items = [];
    if (content.length > 0) {
      items = content;
    } else {
      items = this.chartItems.filter((item: any) => {
        if (item.select && !item.isValid) {
          return item;
        }
      });
    }
    if (items.length > 0) {
      if (items == this.chartItems) {
        //全选了删除
        this.clear();
        this.isNull = true;
      } else {
        const cardIds = items.map((x: any) => x.cartId);
        await del("/cart", { cardIds }).then((res: any) => {
          //message.success('商品删除成功');
          const oldArray = delProducts(this.chartItems, cardIds);
          this.chartItems = oldArray;
          this.setChartItems(oldArray);
          this.compuntePriceTotal();
          this.couponList.length > 0 && this.totalProcuts > 0 && this.bestCoupon();
        });
      }
    } else {
      message.error(window.navigator.language != "zh-CN" ? 'Delete item not selected' : '未选择删除商品');
    }
  }

  //批量移入收藏夹
  @action.bound removeFavorites = async (content: any) => {
    //查找批量的选择的商品
    //查找批量的选择的商品
    let items = [];
    if (content.length > 0) {
      items = content;
    } else {
      items = this.chartItems.filter((item: any) => {
        if (!item.isValid) {
          return item;
        }
      });
    }
    if (items.length > 0) {
      const favorites = items.map((x: any) => {
        return {
          kind: x.kind,
          type: x.type,
          oldGoodsId: x.id,
          goodsId: x.goodsId,
        };
      });
      await del("/favorites", { favorites }).then((res: any) => {
        //message.success('商品收藏成功');
      });
    } else {
      message.error(window.navigator.language != "zh-CN" ? 'No item collection selected' : '未选择商品收藏');
    }
    const oldArray = delProducts(this.chartItems, items);
    this.chartItems = oldArray;
    this.setChartItems(oldArray);
    this.compuntePriceTotal();
  }


  //可用优惠券
  couponInfo = (qualifyList: any) => {
    //未满减前总额
    let priceTotal = 0;
    this.chartItems.map((item: any) => {
      if (item.select && !item.isValid) {
        priceTotal = priceTotal + item.salePrice * item.goodsNum;
      }
    });
    // 优惠数据
    const discountList: [] = qualifyList.map((item: any) => {
      // 优惠金额
      const discount = item.couponType === 'REDUCTION' ? item.money : Number(((100 - item.money) * priceTotal).toFixed(2)) / 100;
      // 最小优惠金额
      const minDiscount = item.couponType === 'REDUCTION' ? item.money : Number(((100 - item.money) * item.ruleMoney).toFixed(2)) / 100;
      //立减和打折
      const money = item.couponType === 'REDUCTION' ? item.money : item.money / 10;
      // 可用商品的金额是否达标了
      const enable = priceTotal >= item.ruleMoney;
      //还差多少
      const diff = Math.max(0, item.ruleMoney - priceTotal);
      return {
        priceTotal, enable, diff, discount, minDiscount, coupon: item, money, ruleMoney: item.ruleMoney, couponType: item.couponType,
      };

    });
    return discountList;
  }

  // 最佳优惠券和下一张最佳优惠券
  @action.bound bestCoupon = () => {
    if (this.couponList.length > 0) {
      const qualifyList = this.couponList.filter((item: any) => {
        const isIncludes = (item.goodsIds || []).some((it: any) => this.cartIds.includes(it));
        return item.isAll || isIncludes;
      }) as any;
      if (qualifyList.length > 0) {
        const couponInfo = this.couponInfo(qualifyList);
        const enables = couponInfo.filter((item: any) => item.enable);
        enables.sort((it1: any, it2: any) => it2.discount - it1.discount);
        const best = enables[0] as any; // 优惠力度最大的一张券
        // 下一张券必须是未达标，且最小优惠力度要大于当前优惠力度的
        const disableds = couponInfo.filter(
          (item: any) => {
            if (!item.enable && item.minDiscount > (best ? best.discount : 0)) {
              return item;
            }
          });
        if (disableds.length > 0) {
          disableds.sort((it1: any, it2: any) => it1.ruleMoney - it2.ruleMoney);
          this.nextCoupon = disableds[0];
        } else {
          this.nextCoupon = best;
        }
      } else {
        message.error(window.navigator.language != "zh-CN" ? 'No coupons' : '暂无优惠券~');
      }
    } else {
      message.error(window.navigator.language != "zh-CN" ? 'No coupons' : '暂无优惠券~');
    }

  }

  @action.bound clear = () => {
    this.chartItems = [];
    this.priceTotal = 0;
    this.totalProcuts = 0;
    this.isNull = false;
    this.allTotal = 0;
    this.selectTotal = false;
    this.couponList = [];
    this.cartIds = [];
    this.nextCoupon = {};
  }

}

export const chartStore = new Store();

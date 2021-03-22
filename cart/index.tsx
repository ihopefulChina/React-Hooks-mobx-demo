import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { message } from "antd";
import { useLocalStore, observer } from "mobx-react";
import { chartStore } from "~/store/cart";
import Item from "./item";
import { toYuan } from "~/tools/tools";
import chartIcon from "./images/chart.png";
import { Spin } from "antd";

import styles from "./index.module.less";

const Index = () => {
  //isNull:购物车是否为空
  //priceTotal：总价格
  //totalProcuts：全选选中的数量
  //chartItems：购物车列表
  //selectTotal:全选状态
  //nextCoupon:优惠信息
  //setChartItems:存储购物车列表
  //updateChartItems:更新选中当前商品购物车列表
  //changeSelectTotal: 更改全选状态
  //allTotal: 除去失效的商品列表总数量
  //removeInvalid:批量删除商品
  //removeFavorites: 批量收藏商品
  const {
    isNull,
    chartItems,
    priceTotal,
    totalProcuts,
    allTotal,
    selectTotal,
    nextCoupon,
    changeSelectTotal,
    removeInvalid,
    removeFavorites,
    init,
  } = useLocalStore(() => chartStore);
  const { t } = useTranslation();
  const history = useHistory();

  //列表头部静态文字
  const headerName = [
    t("cartItemName"),
    t("cartPrice"),
    t("cartQty"),
    t("cartAmount"),
    t("cartOptions"),
  ];

  useEffect(() => {
    //初始化
    init();
  }, []);

  //提交订单
  const placeOrder = () => {
    if (priceTotal > 0 && totalProcuts > 0) {
      //message.success(`${t("navigateTo")}${t("settlement")}${t("page")}`);
      history.push("/pages/homePages/orderConfirm/index");
    } else {
      message.error(t("deleteSelected"));
    }
  };

  return (
    <div className={styles.page}>
      {isNull ? (
        <div className={styles.nullContent}>
          <div
            className={styles.null}
            onClick={() => history.push("/pages/ehmo/index")}
          >
            <img src={chartIcon} alt={t("cart") + " icon"} />
            <h3>{t("cartEmpty")}</h3>
            <p>{t("cartBroseMaill")}</p>
          </div>
        </div>
      ) : chartItems.length > 0 ? (
        <div className={styles.content}>
          <h1>{t("cart")}</h1>
          <div className={styles.shoppingChart}>
            <div className={styles.chartHeader}>
              <ul>
                {headerName.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.chartContent}>
              {/* 购物车商品列表 */}
              {chartItems.map((item: any) => (
                <Item key={item.cartId} item={item}></Item>
              ))}
              {/* 凑单提示 */}
              {nextCoupon.diff > 0 && priceTotal > 0 && (
                <div className={styles.collectingBills}>
                  <span>
                    {`${t("purchaseAnother")}${toYuan(nextCoupon.diff)}, `}
                    {nextCoupon.couponType === "REDUCTION"
                      ? `
                      ${
                        t("toGetDiminished") +
                        toYuan(nextCoupon.money) +
                        t("purchaseReduce")
                      }
                    `
                      : `
                      ${
                        t("purchaseAnotherOff") +
                        nextCoupon.money +
                        t("percentage") +
                        t("purchaseOff")
                      }
                    `}
                  </span>
                  <span onClick={() => history.push("/pages/classify/index")}>
                    {t("addItems") + ">"}
                  </span>
                </div>
              )}
              <div className={styles.optionProduct}>
                <div className={styles.optionBtn}>
                  <span className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="chooseAll"
                      onChange={() => {
                        changeSelectTotal();
                      }}
                      checked={selectTotal}
                    />
                    <label>{t("chooseAll")}</label>
                  </span>
                  <span
                    onClick={() => {
                      removeInvalid([]);
                    }}
                  >
                    {t("delete")}
                  </span>
                  <span
                    onClick={() => {
                      removeFavorites([]);
                    }}
                  >
                    {t("moveFavorite")}
                  </span>
                </div>
                <div className={styles.settlement}>
                  <span className={styles.productTotal}>
                    {`${t("selectedItems")} ${
                      selectTotal ? allTotal : totalProcuts
                    } ${t("pieces")}`}
                  </span>
                  <span className={styles.toatlPrice}>
                    {t("cartTotal")}
                    <span>¥{priceTotal}</span>
                  </span>
                  <button
                    className={
                      window.navigator.language != "zh-CN"
                        ? styles.enStyles
                        : ""
                    }
                    onClick={placeOrder}
                    disabled={priceTotal == 0}
                  >
                    {t("cartOrder")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.contentSpin}>
          <Spin />
        </div>
      )}
    </div>
  );
};

export default observer(Index);

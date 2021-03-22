import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStore, observer } from "mobx-react";
import { chartStore } from "~/store/cart";

import styles from "./item.module.less";

const Item = (props: any) => {
  const { item } = props;
  const [content, userContent] = useState(item);
  const {
    updateChartItems,
    removeInvalid,
    removeFavorites,
  } = useLocalStore(() => chartStore);

  const { t } = useTranslation();

  //数量计数功能
  const onAddSub = (goodsNum: number) => {
    let newContent: any = content;
    //这里是为了防止出现输入小数点
    if (String(goodsNum).indexOf(".") + 1 > 0) {
      goodsNum = Number(content.goodsNum);
    } else {
      newContent =
        goodsNum <= 0
          ? { ...content, goodsNum: 1 }
          : (newContent = { ...content, goodsNum });
    }
    userContent(newContent);
    updateChartItems(newContent);
  };

  //存在初次为undefind情况
  const select = content.select || false;

  //选中
  const onSelect = () => {
    const newSelect = !content.select;
    const newContent = { ...content, select: newSelect };
    userContent(newContent);
    updateChartItems(newContent);
  };

  return (
    <div className={styles.content}>
      <div className={styles.info}>
        <div className={styles.select}>
          {item.isValid ? (
            <span>{t("invalid")}</span>
          ) : (
              <input
                type="checkbox"
                name="select"
                checked={select}
                onChange={() => {
                  onSelect();
                }}
              />
            )}
        </div>
        <div className={styles.thumbnail}>
          <img src={content.cover} alt={`${content.name} Thumbnail`} />
        </div>
        <div className={styles.infoContent}>
          <p>{content.name}</p>
          <p>{content.specNames}</p>
        </div>
      </div>
      <div className={styles.price}>{`￥${content.salePrice}`}</div>
      <div className={styles.total}>
        <button
          disabled={content.goodsNum == 1}
          onClick={() => {
            onAddSub(content.goodsNum - 1);
          }}
        >
          -
        </button>
        <input
          min="1"
          max="99"
          type="number"
          value={content.goodsNum}
          onChange={(e) => onAddSub(Number(e.target.value))}
        />
        <button
          onClick={() => {
            onAddSub(content.goodsNum + 1);
          }}
        >
          +
        </button>
      </div>
      <div className={styles.money}>{`￥${content.goodsNum * content.salePrice
        }`}</div>
      <div className={styles.option}>
        {item.isValid ? (
          <div
            onClick={() => {
              removeInvalid([content]);
            }}
          >
            <span>{t("removeExpired")}</span>
          </div>
        ) : (
            <div>
              <span
                className={styles.del}
                onClick={() => {
                  removeInvalid([content]);
                }}
              >
                {t("delete")}
              </span>
              <span
                onClick={() => {
                  removeFavorites([content]);
                }}
              >
                {t("moveFavorite")}
              </span>
            </div>
          )}
      </div>
    </div>
  );
};

export default observer(Item);

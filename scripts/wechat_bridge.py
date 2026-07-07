"""
Minimal wxauto bridge for NIC-CHAT.

Requirements:
  pip install wxauto requests

Notes:
  - This is an experimental desktop-WeChat bridge, inspired by Astrbot-wechat-bot.
  - It requires Windows desktop WeChat and is not an official WeChat bot API.
  - Keep message frequency low to reduce account risk.
"""

from __future__ import annotations

import os
import time
from typing import Any

import requests
from wxauto import WeChat


NIC_CHAT_URL = os.getenv("NIC_CHAT_URL", "http://localhost:3001/api/openclaw/chat")
LISTEN_NAME = os.getenv("WECHAT_LISTEN_NAME", "")
PERSONA_ID = os.getenv("NIC_CHAT_PERSONA_ID", "default")
SESSION_PREFIX = os.getenv("NIC_CHAT_SESSION_PREFIX", "wechat")
POLL_SECONDS = float(os.getenv("WECHAT_POLL_SECONDS", "1.5"))


def call_nic_chat(text: str, session_id: str, sender: str) -> str:
    payload: dict[str, Any] = {
        "message": text,
        "sessionId": session_id,
        "personaId": PERSONA_ID,
        "source": "wechat",
        "sender": sender,
    }
    response = requests.post(NIC_CHAT_URL, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()
    return data.get("reply") or data.get("message") or ""


def main() -> None:
    if not LISTEN_NAME:
        raise SystemExit("Set WECHAT_LISTEN_NAME to a friend or group name.")

    wx = WeChat()
    wx.AddListenChat(who=LISTEN_NAME, savepic=True)
    print(f"Listening to WeChat chat: {LISTEN_NAME}")
    print(f"Forwarding to: {NIC_CHAT_URL}")

    while True:
      messages = wx.GetListenMessage()
      for chat, items in messages.items():
          for msg in items:
              sender = getattr(msg, "sender", "") or LISTEN_NAME
              content = getattr(msg, "content", "") or ""
              if not content.strip():
                  continue

              session_id = f"{SESSION_PREFIX}:{LISTEN_NAME}:{sender}"
              print(f"[{sender}] {content}")
              try:
                  reply = call_nic_chat(content, session_id, sender)
              except Exception as exc:
                  reply = f"接口调用失败：{exc}"

              if reply:
                  chat.SendMsg(reply)
                  print(f"[NIC-CHAT] {reply}")

      time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()

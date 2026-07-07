import requests
import re
import json
import sys
from datetime import timedelta


class FeishuMinutes:

    BASE = "https://reachauto.feishu.cn"

    def __init__(self, cookie_file):

        with open(cookie_file, "r", encoding="utf-8") as f:
            self.cookies = json.load(f)

        self.session = requests.Session()

        self.session.cookies.update(
            self.cookies
        )

        self.headers = {
            "accept":
            "application/json, text/plain, */*",

            "platform":
            "web",

            "x-lsc-terminal":
            "web",

            "user-agent":
            "Mozilla/5.0",

            "referer":
            self.BASE + "/",
        }


    def get_token(self, url):

        m = re.search(
            r"/minutes/([a-zA-Z0-9]+)",
            url
        )

        if not m:
            raise Exception(
                "无法解析 object_token"
            )

        return m.group(1)


    def api(self, path, params):

        url = self.BASE + path

        r = self.session.get(
            url,
            params=params,
            headers=self.headers
        )

        if r.status_code != 200:
            print("STATUS:", r.status_code)
            print("URL:", r.url)
            print("BODY:", r.text[:2000])
            r.raise_for_status()

        data = r.json()

        if data.get("code") != 0:
            print("API ERROR:", json.dumps(data, ensure_ascii=False, indent=2)[:2000])
            raise Exception(data)

        return data["data"]



    def get_speakers(self, token):

        data = self.api(
            "/minutes/api/speakers",
            {
                "size":10000,
                "translate_lang":"default",
                "object_token":token,
                "language":"zh_cn"
            }
        )

        info = data["speaker_info_map"]

        result={}

        for k,v in info.items():

            result[k] = v.get(
                "user_name",
                "未知"
            )

        return (
            data["paragraph_to_speaker"],
            result
        )


    def get_subtitles(self, token):

        data = self.api(
            "/minutes/api/subtitles_v2",
            {
                "paragraph_id":"",
                "size":10000,
                "translate_lang":"default",
                "is_fluent":"false",
                "filter_speaker":"true",
                "object_token":token,
                "language":"zh_cn"
            }
        )

        return data["paragraphs"]



    def format_time(self, ms):

        sec=int(ms)/1000

        h=int(sec//3600)

        m=int(
            sec%3600//60
        )

        s=int(sec%60)

        return (
            f"{h:02}:{m:02}:{s:02}"
        )



    def export(self,url,out):

        token=self.get_token(url)

        print(
            "object_token:",
            token
        )


        paragraph_speaker, speaker_map = \
            self.get_speakers(token)


        paragraphs=self.get_subtitles(token)


        lines=[]

        lines.append(
            "# 飞书妙记转写\n"
        )


        for p in paragraphs:

            pid=p["pid"]

            speaker_id = \
                paragraph_speaker.get(pid)


            speaker = speaker_map.get(
                speaker_id,
                "未知"
            )


            start=p.get(
                "start_time",
                "0"
            )


            text=""

            for sent in p.get(
                "sentences",
                []
            ):

                for c in sent.get(
                    "contents",
                    []
                ):

                    text += c.get(
                        "content",
                        ""
                    )


            if text.strip():

                lines.append(
                    f"## {self.format_time(start)} {speaker}\n"
                )

                lines.append(
                    text.strip()
                    +
                    "\n"
                )


        with open(
            out,
            "w",
            encoding="utf-8"
        ) as f:

            f.write(
                "\n".join(lines)
            )


        print(
            "完成:",
            out
        )



if __name__=="__main__":

    if len(sys.argv)<2:

        print(
            """
使用:

python feishu_minutes_export.py \
https://xxx.feishu.cn/minutes/xxxx
"""
        )

        sys.exit()


    url=sys.argv[1]


    exporter=FeishuMinutes(
        "cookies.json"
    )


    exporter.export(
        url,
        "meeting.md"
    )
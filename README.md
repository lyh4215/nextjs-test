- down.sql 만들기
https://wiki.loliot.net/docs/lang/javascript/libraries/prisma/migrate

==========



- 3개의 Div로 나눔
- 자신이 height, width가 몇인지 탐색을 통해 알게 해주는 함수 만들기
- main div는 grid로 그냥 block list정렬해서 사용
- 정렬알고리즘 공부(ts에서)

---
DnD-kit란
React 전용 Drag & Drop 라이브러리.
) 모듈 구조

@dnd-kit/core → 기반 드래그 기능

@dnd-kit/sortable → 정렬 기능(리스트 순서 바꾸기)

@dnd-kit/utilities → 유틸


✅ 오프라인 dnd-kit 설치 3단계 요약
1️⃣ 온라인 PC에서 .tgz 파일 3개 다운로드

브라우저에서 아래 주소 3개 다운로드:

https://registry.npmjs.org/@dnd-kit/core/-/core-6.1.0.tgz
https://registry.npmjs.org/@dnd-kit/sortable/-/sortable-8.0.0.tgz
https://registry.npmjs.org/@dnd-kit/utilities/-/utilities-3.2.1.tgz


(또는 최신 버전으로 동일한 구조의 URL 모두 가능)

2️⃣ USB에 넣어서 오프라인 PC로 옮기기

core-6.1.0.tgz
sortable-8.0.0.tgz
utilities-3.2.1.tgz

이 3개를 Next.js 프로젝트 폴더에 복사한다.

3️⃣ 오프라인 PC에서 npm install (로컬 파일 설치)

프로젝트 루트에서:

npm install ./core-6.1.0.tgz
npm install ./sortable-8.0.0.tgz
npm install ./utilities-3.2.1.tgz


이러면

node_modules 생성

package-lock.json 갱신

React와 완벽 호환

완전 오프라인에서 정상 설치 완료.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

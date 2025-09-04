# BY: ChatGPT-4, 02
# AMD64とARM64プラットフォームに可能な限り互換性を提供します

# 公式のnodeベースイメージを使用します
FROM node:alpine

# 作業ディレクトリを設定します
WORKDIR /usr/src/app

# package.json と package-lock.json を作業ディレクトリにコピーします
COPY package*.json ./

# 依存関係をインストールします
RUN npm install

# 他のソースコードファイルを作業ディレクトリにコピーします
COPY . .

# build
RUN npm run build

# コマンドを実行します
CMD [ "node", "./dist/app.js" ]
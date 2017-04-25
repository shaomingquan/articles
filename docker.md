#### ***concepts***

*why docker?*

- 避免重复的安装工作。
- 兼容各种操作系统的运行环境。
- 与操作系统隔离，更安全。

*两个重要的概念*

- image：镜像，可执行的package。包括代码，运行时(py|node...)，环境变量，配置文件。
- container：容器，一个镜像的运行时实例。

*虚拟机vs容器*

vm。需要虚拟机管理程序和物理机，每个vm需要安装一个guest OS。

- hypervisor：虚拟机管理程序。
- infrastructure：基础设施（物理机）。

![](/images/1493047067tp.png)

容器。需要docker，host OS，物理机。这里的host OS也可以是上面的guest OS。

![](/images/1493047396wo.png)

#### ***doing***

*helloworld*

`docker run hello-world` 看似报错。。不过停住别动，第一次会去下载镜像。--||

*Dockerfile*

使用Dockerfile定义容器。

```
# Use an official Python runtime as a base image
FROM python:2.7-slim

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
ADD . /app

# Install any needed packages specified in requirements.txt
RUN pip install -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NAME World

# Run app.py when the container launches
CMD ["python", "app.py"]
```

加好app.py & requirements.txt 之后，运行`docker build -t friendlyhello .`创建第一个自定义镜像。https://docs.docker.com/get-started/part2/#build-the-app


*run*

运行容器：`docker run -p 4000:80 friendlyhello`通过系统的4000映射到容器中的80端口。

访问出现helloworld和redis错误（伏笔？）。

```
docker run -d -p 4000:80 friendlyhello // -d 后台进程

$ docker ps // 运行了哪些容器
CONTAINER ID        IMAGE               COMMAND             CREATED
1fa4ab2cf395        friendlyhello       "python app.py"     28 seconds ago
You’ll see that CONTAINER ID matches what’s on http://localhost:4000.

docker stop 1fa4ab2cf395 // 通过查看到的容器号停掉对应的容器。

```

*share*

需要一个登记处，一个登记处是一系列的仓库，像github的仓库那样。需要找一个公共的登记处或者自行搭建。

下面注册到官方的登记处，并在网站上创建一个新的仓库。在命令行登陆docker，`docker login`，将当前镜像关联到远程仓库的一个版本`docker tag hello-world shaomingquan/helloworld:v1.0.0`，上传本地仓库到远程仓库`docker push shaomingquan/helloworld:v1.0.0`。使用tag为当前的仓库提供版本机制。

https://cloud.docker.com/swarm/shaomingquan/repository/registry-1.docker.io/shaomingquan/helloworld/general

换台机器，运行 `docker run -p 4000:80 shaomingquan/helloworld:v1.0.0`。
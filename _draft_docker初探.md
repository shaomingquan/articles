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

同样道理，我们也可以用nodejs做类似的事情 https://docs.npmjs.com/misc/scripts#default-values。

也可以不每次打包。

`docker run -it --rm --name my-running-script -v "$PWD":/usr/src/app -w /usr/src/app node:4 node your-daemon-or-script.js`

上面命令的意思是，容器内的`usr/src/app`对应当前目录，移动容器内的工作目录到`usr/src/app`，使用node:4镜像根据配置生成容器，并在容器内运行node以及应用。volume是容器间文件共享的策略，这里面一般会有代码，以及对每个镜像行为的配置。可以添加ro选项来限制它只读`"$PWD":/usr/src/app:ro`。

```
--rm	false	Automatically remove the container when it exits
--workdir, -w	 	Working directory inside the container
--volume, -v	 	Bind mount a volume
```

所以是否要重新构建镜像，按需。

*share*

在分布式应用中镜像需要分享给各个机器。

需要一个登记处，一个登记处是一系列的仓库，像github的仓库那样。需要找一个公共的登记处或者自行搭建(https://docs.docker.com/datacenter/dtr/2.2/guides/)。

下面注册到官方的登记处，并在网站上创建一个新的仓库。在命令行登陆docker，`docker login`，将当前镜像关联到远程仓库的一个版本`docker tag hello-world shaomingquan/helloworld:v1.0.0`，上传本地仓库到远程仓库`docker push shaomingquan/helloworld:v1.0.0`。使用tag为当前的仓库提供版本机制。

https://cloud.docker.com/swarm/shaomingquan/repository/registry-1.docker.io/shaomingquan/helloworld/general

换台机器，运行 `docker run -p 4000:80 shaomingquan/helloworld:v1.0.0`。

*service*

与直接run最大的不同，service可以管理重启，更多是投入在生产中。

一个service运行一个镜像，它规定了镜像如何运行，完成容量管理，服务重启等功能。`docker-compose.yml`定义了容器如何运行。比如下面的service规定了五个负载均衡的容器。

```
version: "3"
services:
  web:
    image: friendlyhello
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: "0.1"
          memory: 50M
      restart_policy:
        condition: on-failure
    ports:
      - "3002:80"
    networks:
      - webnet
networks:
  webnet:
```
如下，有五个容器。
![](/images/1493132249kl.png)

*swarm*

swarm是集群内部的一组运行docker的机器。通过swarm manager管理。

`docker swarm init`看起swarm模式并且使用当前机器作为swarm manager。


使用虚拟机在本地测试集群。创建两台虚拟机。创建第一台的时候需要下载镜像。第二个就很快了。
```
$ docker-machine create --driver virtualbox myvm1
$ docker-machine create --driver virtualbox myvm2
```

`$ docker-machine ssh myvm1 "docker swarm init"` 让myvm1作为manager。

```
$ docker-machine ssh myvm2 "docker swarm join \
--token  \
:"

This node joined a swarm as a worker. (blocked here)
```

报错
```
Error response from daemon: rpc error: code = 13 desc = connection error: desc = "transport: remote error: tls: bad certificate"
```
解决上面报错的方法 https://github.com/docker/machine/issues/4064，不要用ls里面的port。

使用scp上传文件 `docker-machine scp docker-compose.yml myvm1:~`

剩下的按照service的步骤，在myvm1中执行，服务将均匀部署在整个集群。

```
$ docker-machine ssh myvm1 "docker stack ps getstartedlab"

ID            NAME        IMAGE              NODE   DESIRED STATE
jq2g3qp8nzwx  test_web.1  username/repo:tag  myvm1  Running
88wgshobzoxl  test_web.2  username/repo:tag  myvm2  Running
vbb1qbkb0o2z  test_web.3  username/repo:tag  myvm2  Running
ghii74p9budx  test_web.4  username/repo:tag  myvm1  Running
0prmarhavs87  test_web.5  username/repo:tag  myvm2  Running
```

*stack*

stack 是分布式应用程序的最上层的结构。他是一组关联的服务，方便这些服务统一的容量管理。在service中，已经使用了stack命令，只不过是个单service的stack。

需要加一个服务。在教程中有两个新选项。

- volumes：定义了docker内部访问外部资源的映射，因为发布代码都是在外部，而不会发布到docker内部。
- deploy：定义了容器部署的行为。


https://docs.docker.com/get-started/part5/#adding-a-new-service-and-redeploying

官网例子是在manager上面运行了一个可视化的界面。

加入redis服务有一个重要的点是要让db文件夹映射到host的文件目录下，因为容器redeploy的时候会擦除这些数据。

```
volumes:
      - ./data:/data
```
redis的官方镜像已经被批准为一个短名称  redis。
```
redis:
    image: redis
```

部署：
`docker-machine ssh myvm1 "docker stack deploy -c docker-compose.yml getstartedlab"` 在manager上面运行stack deploy， 指定配置文件，给stack取个名字。

*在容器内执行一个命令。*


装一个Ubuntu `docker run -itd --name=networktest ubuntu`。可以用`docker exec`执行一个命令。-itd === -i -t -d(后台运行*)。

```
$ docker exec 6f974c13511f date
Wed Apr 26 14:49:03 UTC 2017
```

```
$ docker exec 69427306c7b7 node -v
v4.8.2
```

也可以使用`docker attach`登录container中。 

```
$ docker attach 6f974c13511f
root@6f974c13511f:/#
```

当exit或者ctrl-d的时候，会使容器退出，但docker仍然占用`/networktest`这个名字。需要执行`docker container rm /networktest`去移除这个名字，才可以用这个名字继续重启。

*拓展一个镜像*

拓展一个镜像有两种方法。
- exec装新东西，在发布到一个新的镜像。
- FROM it。
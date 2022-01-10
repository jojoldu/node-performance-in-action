# NodeJS 와 PostgreSQL Connection Pool

> Mac을 사용하는 경우엔 ApacheBench 가 기본적으로 설치되어있다.  
> 설치여부를 확인하기 위해서 `ab -v` 로 확인해보면 된다


![pool1-result](./images/pool1-result.png)

* 이 테스트는 **20명의 동시 사용자로 총 100번을 호출**했다
* 요청당 평균 시간
  * `Time per request` 의 첫번째 값
  * 이 요청은 60344 ms, 즉 평균 60초가 요청되었다
* 예상되는 평균 응답시간
  * `Percentage of the requests served...` 항목
  * 60307ms ~ 60435ms 로 응답한다
* 초당 요청
  * `Request per second` 항목
  * 1초에 최대 요청양을 이야기한다.
  * 현재 0.33 인데, 이는 **1초에 1건도 처리 못한다**는 것을 의미한다.


```bash
ab -n 1000 -c 15 -s 600 http://localhost:3000/test-timeout/
```

#sonlar = 1,5,7,9,10
#print (max(sonlar))
#print (min(sonlar))
#print(sum(sonlar))
#sonlar = [1,2,3,4,5]
#juft_sonlar = list(filter(lambda x: x % 2 == 0,sonlar))
#print(juft_sonlar)

sonlar = ["131231234", "12342", "123123", "2", "3", "45"]

sonlar.sort(key=lambda x: len(x) >= 5)

print(sonlar)
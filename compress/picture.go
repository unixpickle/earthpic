package main

import (
	"io/ioutil"
	"sort"

	"github.com/unixpickle/earthpic"
)

type Picture struct {
	Latitudes []float64
	Rows      map[float64][]earthpic.Pixel
}

func ReadPicture(path string) (*Picture, error) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var rawPic earthpic.Picture
	if err := rawPic.UnmarshalText(data); err != nil {
		return nil, err
	}

	res := &Picture{Rows: map[float64][]earthpic.Pixel{}}
	for _, pixel := range rawPic.Pixels {
		res.Rows[pixel.Lat] = append(res.Rows[pixel.Lat], pixel)
	}
	for lat, row := range res.Rows {
		res.Latitudes = append(res.Latitudes, lat)
		sort.Sort(lonSorter(row))
	}
	sort.Float64s(res.Latitudes)
	return res, nil
}

func (p *Picture) RawPicture() *earthpic.Picture {
	res := new(earthpic.Picture)
	for _, lat := range p.Latitudes {
		row := p.Rows[lat]
		for _, pixel := range row {
			res.Pixels = append(res.Pixels, pixel)
		}
	}
	return res
}

type lonSorter []earthpic.Pixel

func (l lonSorter) Len() int {
	return len(l)
}

func (l lonSorter) Swap(i, j int) {
	l[i], l[j] = l[j], l[i]
}

func (l lonSorter) Less(i, j int) bool {
	return l[i].Lon < l[j].Lon
}

import numpy as np

# import matplotlib.pyplot as plt
# from scipy import signal
# from scipy.io import wavfile

# sample_rate, data  = wavfile.read('data/XC878566 - Black Woodpecker - Dryocopus martius.wav')

# data = data[:, 0]

# window_size = 1024*4

# hop_size = 512

# stft = np.abs(np.array([np.fft.fft(data[i:i+window_size])

# for i in range(0, len(data)-window_size, hop_size)]))

# plt.imshow(np.log(stft.T), aspect='auto', origin='lower', cmap='gray',
# extent=[0, len(data)/sample_rate, 0, sample_rate/2])

# plt.ylabel('Frequency [Hz]')
# plt.xlabel('Time [sec]')
# plt.show()

import librosa

import librosa.display

import matplotlib

import matplotlib.pyplot as plt

# Load audio file

audio_path = 'data/audio/XC878566 - Black Woodpecker - Dryocopus martius.wav'

y, sr = librosa.load(audio_path)

# Generate spectrogram

D = librosa.stft(y)

S = librosa.amplitude_to_db(D, ref=np.max)

# Visualize spectrogram

N = 256
q = 0.6
vals = np.ones((N, 4))

da = np.zeros(round(q*N))
t = np.concatenate((da, np.linspace(0.5, 1, round(N-q*N))))
vals[:, 0] = t
vals[:, 1] = t
vals[:, 2] = t
newcmp = matplotlib.colors.ListedColormap(vals)

fig, ax = plt.subplots()
img = librosa.display.specshow(S, sr=sr, x_axis='time',
                         y_axis='linear', cmap=newcmp, auto_aspect=True)


print(sr)
px = 1/plt.rcParams['figure.dpi']
fig.set_size_inches((np.shape(S)[1]*px, np.shape(S)[0]*px))

plt.subplots_adjust(0, 0, 1, 1)
plt.savefig('filename2.webp')
plt.show()